import nodemailer, { Transporter } from 'nodemailer';
import { auditService } from '../audit/audit.service';
import { AuditAction, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { notificationService } from '../notifications/notification.service';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Mức ưu tiên ngân sách email (Resend Free: 100 email/ngày):
   * - 'high' (mặc định): email giao dịch bắt buộc (xác thực, quên mật khẩu, biên nhận VIP, khóa tài khoản...) -> luôn gửi.
   * - 'low': email hàng loạt / nhắc nhở (Full Test AI, nhắc VIP sắp hết hạn...) -> tự dừng ở ngưỡng 80/100 email/ngày để dành 20 email cho giao dịch bắt buộc.
   */
  priority?: 'high' | 'low';
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private frontendUrl: string;
  private fromSender: string;
  private provider: 'resend' | 'smtp' = 'smtp';
  private resendApiKey: string | null = null;
  private resendFrom: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.fromSender = process.env.SMTP_FROM || `"APTIS KỲ TÍCH" <${process.env.SMTP_USER || 'no-reply@aptiskytich.vn'}>`;

    // Địa chỉ gửi của Resend phải thuộc domain đã verify. Mặc định suy ra từ FRONTEND_URL.
    let siteHost = 'aptisesolpremier.com';
    try {
      siteHost = new URL(this.frontendUrl).hostname.replace(/^www\./, '');
    } catch {
      /* giữ mặc định */
    }
    this.resendFrom = process.env.EMAIL_FROM || `Aptis E-learning <no-reply@${siteHost}>`;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const smtpUsable = !!(user && pass && !pass.includes('your-app-password') && !pass.includes('xxxx'));
    const resendKey = process.env.RESEND_API_KEY;
    const resendUsable = !!(resendKey && resendKey.startsWith('re_'));

    // Chọn nhà cung cấp: EMAIL_PROVIDER=resend|smtp; mặc định ưu tiên Resend nếu có API key hợp lệ
    const requested = (process.env.EMAIL_PROVIDER || '').toLowerCase();
    if (requested === 'resend' || (requested !== 'smtp' && resendUsable)) {
      if (resendUsable) {
        this.provider = 'resend';
        this.resendApiKey = resendKey as string;
        this.isConfigured = true;
        console.log(`[EmailService] Resend configured. From: ${this.resendFrom}`);
        return;
      }
      console.warn('[EmailService] EMAIL_PROVIDER=resend nhưng RESEND_API_KEY thiếu hoặc không hợp lệ (phải bắt đầu bằng re_). Chuyển sang SMTP nếu có.');
    }

    // Kiểm tra cấu hình SMTP khả dụng
    if (smtpUsable) {
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        // Tái sử dụng kết nối SMTP, tránh mở kết nối mới cho từng email khi gửi số lượng lớn
        pool: true,
        maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 3,
        maxMessages: 100,
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.isConfigured = true;
      console.log(`[EmailService] SMTP Transporter configured (${host}:${port}) for ${user}`);
    } else {
      this.isConfigured = false;
      console.error(`[EmailService] CẢNH BÁO: Chưa cấu hình Resend hoặc SMTP hợp lệ. Mọi lệnh gửi email sẽ báo lỗi thực tế (không chạy chế độ Mock).`);
    }
  }

  /**
   * Gửi email qua Resend REST API (có retry nhẹ khi gặp 429/5xx).
   * Ném lỗi nếu thất bại để tầng trên ghi audit log / hàng đợi retry.
   */
  private async sendViaResend(options: SendMailOptions): Promise<{ id?: string }> {
    const maxAttempts = 3;
    let lastError = 'Resend error';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.resendFrom,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (res.ok) {
        return (await res.json().catch(() => ({}))) as { id?: string };
      }

      const body: any = await res.json().catch(() => ({}));
      lastError = `Resend ${res.status} ${body?.name || ''}: ${body?.message || res.statusText}`.trim();

      // 429 (rate limit hoặc quota ngày) và 5xx có thể thử lại; lỗi còn lại (domain chưa verify, from sai...) thì dừng
      const retryable = res.status === 429 || res.status >= 500;
      const quotaExceeded = /quota/i.test(`${body?.name} ${body?.message}`);
      if (!retryable || quotaExceeded || attempt === maxAttempts) break;

      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = (retryAfter > 0 ? retryAfter : attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    throw new Error(lastError);
  }

  /**
   * Khung HTML Email chuẩn giao diện Aptis Kỳ Tích
   */
  private wrapEmailTemplate(title: string, bodyContent: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1e293b; line-height: 1.6; }
    .email-container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .email-header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
    .email-body { padding: 32px 28px; }
    .email-btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 20px 0; text-align: center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 700; }
    .email-footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .email-footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>APTIS KỲ TÍCH</h1>
      <p>Hệ thống Luyện thi &amp; Chấm điểm Chuẩn British Council</p>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <p>Email này được gửi tự động từ hệ thống <strong>Aptis Kỳ Tích</strong>.</p>
      <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ Hotline: <strong>0379 866 596</strong> hoặc Zalo hỗ trợ.</p>
      <p>&copy; ${new Date().getFullYear()} Aptis Kỳ Tích. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Hàm cốt lõi gửi email (Không dùng chế độ Mock: nếu thiếu cấu hình hoặc gửi lỗi sẽ ghi Audit Log SENT_FAILED,
   * bắn thông báo chuông cảnh báo cho Admin và trả về trạng thái thất bại thật).
   * Tích hợp kiểm soát ngân sách 80/100 email/ngày UTC qua Redis.
   */
  async sendMail(
    options: SendMailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string; skippedByBudget?: boolean }> {
    const priority = options.priority || 'high';
    const lowPriorityLimit = Number(process.env.EMAIL_LOW_PRIORITY_DAILY_LIMIT) || 80;
    const dailyLimit = Number(process.env.EMAIL_DAILY_LIMIT) || 100;

    try {
      if (!this.isConfigured || (this.provider === 'smtp' && !this.transporter)) {
        throw new Error(
          'Hệ thống gửi email chưa được cấu hình hợp lệ (thiếu RESEND_API_KEY hoặc thông tin SMTP_USER/SMTP_PASS).'
        );
      }

      // Kiểm tra ngân sách 80/100 email/ngày đối với các email ưu tiên thấp
      const { emailQueue } = await import('./email.queue');
      if (priority === 'low') {
        const sentToday = await emailQueue.getTodaySentCount();
        if (sentToday >= lowPriorityLimit) {
          const skipMsg = `Đã đạt ngưỡng ngân sách ${sentToday}/${lowPriorityLimit} email/ngày cho nhóm ưu tiên thấp (dành ${dailyLimit - lowPriorityLimit} email cho giao dịch bắt buộc).`;
          console.warn(`[EmailService BUDGET] Bỏ qua email ưu tiên thấp tới ${options.to}: ${skipMsg}`);
          Promise.resolve(
            auditService.record({
              action: AuditAction.EMAIL_NOTIFICATION_SENT,
              entityType: 'EMAIL',
              entityId: `budget-skip-${Date.now()}`,
              description: `[NGÂN SÁCH EMAIL] Tạm dừng gửi email ưu tiên thấp tới ${options.to}: "${options.subject}" (${sentToday}/${dailyLimit})`,
              newValue: {
                to: options.to,
                subject: options.subject,
                priority,
                status: 'SKIPPED_BUDGET_LIMIT',
                sentToday,
                lowPriorityLimit,
              },
              systemActor: {
                name: 'Hệ thống Email',
                email: 'mailer@aptiskytich.vn',
                role: 'SYSTEM',
              },
            })
          ).catch(() => {});

          return { success: false, skippedByBudget: true, error: skipMsg };
        }
      }

      let messageId: string | undefined;
      if (this.provider === 'resend') {
        const sent = await this.sendViaResend(options);
        messageId = sent.id;
      } else {
        const info = await (this.transporter as Transporter).sendMail({
          from: this.fromSender,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        messageId = info.messageId;
      }
      const info = { messageId };

      const newCount = await emailQueue.incrementTodaySentCount();
      console.log(
        `[EmailService SUCCESS] (${this.provider} | ${newCount}/${dailyLimit} today UTC) Mail sent to ${options.to}. MessageId: ${info.messageId}`
      );

      // Khi chạm đúng ngưỡng 80/100 email trong ngày UTC, bắn chuông cảnh báo cho Admin
      if (newCount === lowPriorityLimit) {
        Promise.resolve(
          prisma.user?.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, is_active: true },
            select: { id: true },
          })
        )
          .then((admins) => {
            if (!Array.isArray(admins)) return;
            for (const admin of admins) {
              Promise.resolve(
                notificationService.createNotification({
                  userId: admin.id,
                  type: NotificationType.SYSTEM,
                  title: `[CẢNH BÁO QUOTA EMAIL] Đã dùng ${newCount}/${dailyLimit} email hôm nay`,
                  message: `Hệ thống tự động tạm ngưng email ưu tiên thấp và giữ ${dailyLimit - lowPriorityLimit} email còn lại cho các giao dịch bắt buộc.`,
                  link: '/admin/audit-logs',
                })
              ).catch(() => {});
            }
          })
          .catch(() => {});
      }

      // Ghi Audit Log gửi mail thành công vào cơ sở dữ liệu
      Promise.resolve(
        auditService.record({
          action: AuditAction.EMAIL_NOTIFICATION_SENT,
          entityType: 'EMAIL',
          entityId: info.messageId || `mail-${Date.now()}`,
          description: `[EMAIL THÀNH CÔNG] Đã gửi email tới ${options.to}: "${options.subject}" (${newCount}/${dailyLimit} hôm nay)`,
          newValue: {
            to: options.to,
            subject: options.subject,
            provider: this.provider,
            priority,
            sentToday: newCount,
            status: 'SENT_SUCCESS',
            messageId: info.messageId,
            sentAt: new Date(),
          },
          systemActor: {
            name: 'Hệ thống Email',
            email: 'mailer@aptiskytich.vn',
            role: 'SYSTEM',
          },
        })
      ).catch(() => {});

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      const errorMessage = err?.message || 'Lỗi gửi email không xác định';
      console.error(`[EmailService ERROR] Failed to send email to ${options.to}:`, errorMessage);

      // 1. Ghi Audit Log cảnh báo gửi mail thất bại
      Promise.resolve(
        auditService.record({
          action: AuditAction.EMAIL_NOTIFICATION_SENT,
          entityType: 'EMAIL',
          entityId: `fail-${Date.now()}`,
          description: `[EMAIL THẤT BẠI] Lỗi gửi email tới ${options.to}: "${options.subject}". Lỗi: ${errorMessage}`,
          newValue: {
            to: options.to,
            subject: options.subject,
            provider: this.provider,
            status: 'SENT_FAILED',
            error: errorMessage,
            failedAt: new Date(),
          },
          systemActor: {
            name: 'Hệ thống Email',
            email: 'mailer@aptiskytich.vn',
            role: 'SYSTEM',
          },
        })
      ).catch(() => {});

      // 2. Bắn thông báo chuông cảnh báo cho Quản trị viên để nắm bắt sự cố ngay lập tức
      Promise.resolve(
        prisma.user?.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, is_active: true },
          select: { id: true },
        })
      )
        .then((admins) => {
          if (!Array.isArray(admins)) return;
          for (const admin of admins) {
            Promise.resolve(
              notificationService.createNotification({
                userId: admin.id,
                type: NotificationType.SYSTEM,
                title: `[LỖI GỬI EMAIL] Không gửi được tới ${options.to}`,
                message: `Tiêu đề: "${options.subject}". Nguyên nhân: ${errorMessage}`,
                link: '/admin/audit-logs',
              })
            ).catch(() => {});
          }
        })
        .catch(() => {});

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 1. Gửi email Đặt lại mật khẩu (Password Reset)
   */
  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    fullName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    const recipientName = fullName || 'Học viên';

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Yêu cầu đặt lại mật khẩu</h2>
      <p>Xin chào <strong>${recipientName}</strong>,</p>
      <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email: <strong>${toEmail}</strong>.</p>
      <p>Để hoàn tất quá trình tạo mật khẩu mới, bạn vui lòng nhấp vào nút bên dưới:</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" class="email-btn" target="_blank">Đặt Lại Mật Khẩu Ngay</a>
      </div>

      <div class="info-box">
        <p style="margin:0; font-size:13px; color:#475569;">
          <strong>Lưu ý bảo mật:</strong><br>
          • Đường dẫn này chỉ có hiệu lực trong vòng <strong>60 phút</strong> kể từ khi yêu cầu.<br>
          • Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn tuyệt đối.
        </p>
      </div>

      <p style="font-size:12px; color:#94a3b8; word-break:break-all;">
        Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết này vào trình duyệt: <br>
        <a href="${resetUrl}" style="color:#4f46e5;">${resetUrl}</a>
      </p>
    `;

    return this.sendMail({
      to: toEmail,
      subject: '[Aptis Kỳ Tích] Hướng dẫn đặt lại mật khẩu tài khoản',
      html: this.wrapEmailTemplate('Đặt lại mật khẩu', bodyContent),
      text: `Xin chào ${recipientName}, truy cập link sau để đặt lại mật khẩu: ${resetUrl}`,
    });
  }

  /**
   * 1b. Gửi email Xác thực tài khoản (Email Verification)
   */
  async sendVerificationEmail(
    toEmail: string,
    verificationToken: string,
    fullName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const verifyUrl = `${this.frontendUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const recipientName = fullName || 'Học viên';

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Xác thực tài khoản học tập của bạn</h2>
      <p>Xin chào <strong>${recipientName}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Aptis Kỳ Tích</strong> — Nền tảng Luyện thi &amp; Chấm điểm Chuẩn British Council.</p>
      <p>Để bảo vệ tài khoản, kích hoạt đầy đủ quyền lợi nhận kết quả chấm thi Nói/Viết và thông báo quan trọng, bạn vui lòng xác nhận địa chỉ email bằng cách nhấp vào nút bên dưới:</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" class="email-btn" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);">Xác Thực Email Ngay</a>
      </div>

      <div class="info-box">
        <p style="margin:0; font-size:13px; color:#475569;">
          <strong>Thời hạn hiệu lực:</strong> Liên kết này có giá trị trong vòng <strong>24 giờ</strong>.<br>
          <strong>Bảo mật:</strong> Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email.
        </p>
      </div>

      <p style="font-size:12px; color:#94a3b8; word-break:break-all;">
        Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết này vào trình duyệt: <br>
        <a href="${verifyUrl}" style="color:#4f46e5;">${verifyUrl}</a>
      </p>
    `;

    return this.sendMail({
      to: toEmail,
      subject: '[Aptis Kỳ Tích] Vui lòng xác thực địa chỉ email của bạn',
      html: this.wrapEmailTemplate('Xác thực tài khoản', bodyContent),
      text: `Xin chào ${recipientName}, truy cập link sau để xác thực email: ${verifyUrl}`,
    });
  }

  /**
   * 2. Gửi email Chào mừng & Cấp tài khoản mới (Bulk Import / Admin tạo)
   */
  buildAccountCreatedMail(
    toEmail: string,
    tempPassword: string,
    fullName: string,
    role: string = 'STUDENT'
  ): SendMailOptions {
    const loginUrl = `${this.frontendUrl}/auth`;

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Chào mừng bạn đến với Aptis Kỳ Tích!</h2>
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Tài khoản học tập của bạn trên nền tảng luyện thi Aptis ESOL Premier đã được khởi tạo thành công.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Trang đăng nhập:</span>
          <span class="info-value"><a href="${loginUrl}" style="color:#4f46e5;">${loginUrl}</a></span>
        </div>
        <div class="info-row">
          <span class="info-label">Tài khoản (Email):</span>
          <span class="info-value">${toEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mật khẩu khởi tạo:</span>
          <span class="info-value" style="font-family:monospace; font-size:15px; color:#e11d48; background:#ffe4e6; padding:2px 8px; border-radius:4px;">${tempPassword}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vai trò:</span>
          <span class="info-value">${role}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${loginUrl}" class="email-btn" target="_blank">Đăng Nhập Vào Học Ngay</a>
      </div>

      <p style="font-size:13px; color:#475569;">
        <strong>Khuyến nghị:</strong> Sau khi đăng nhập lần đầu tiên, bạn nên vào mục <em>Hồ sơ cá nhân &rarr; Đổi mật khẩu</em> để đảm bảo an toàn cho tài khoản.
      </p>
    `;

    return {
      to: toEmail,
      subject: '[Aptis Kỳ Tích] Thông tin tài khoản học tập của bạn',
      html: this.wrapEmailTemplate('Tài khoản mới', bodyContent),
      text: `Xin chào ${fullName}, tài khoản Aptis Kỳ Tích của bạn đã được tạo. Email: ${toEmail}, Mật khẩu: ${tempPassword}. Đăng nhập tại: ${loginUrl}`,
      priority: 'high',
    };
  }

  async sendAccountCreatedEmail(toEmail: string, tempPassword: string, fullName: string, role: string = 'STUDENT'): Promise<void> {
    await this.sendMail(this.buildAccountCreatedMail(toEmail, tempPassword, fullName, role));
  }

  /**
   * 3. Gửi email Thông báo kết quả chấm thi Nói/Viết từ Giảng viên
   */
  async sendExamGradedEmail(toEmail: string, data: {
    fullName: string;
    examTitle: string;
    totalScore: number | string;
    cefrLevel?: string;
    teacherName?: string;
    teacherNotes?: string;
    submissionId: string;
  }): Promise<void> {
    const detailUrl = `${this.frontendUrl}/history`;

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Bài thi của bạn đã được chấm điểm!</h2>
      <p>Xin chào <strong>${data.fullName}</strong>,</p>
      <p>Giảng viên <strong>${data.teacherName || 'Chuyên môn'}</strong> vừa hoàn tất chấm và đánh giá chi tiết bài thi của bạn.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Đề thi:</span>
          <span class="info-value">${data.examTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Điểm tổng kết:</span>
          <span class="info-value" style="color:#059669; font-size:16px;">${data.totalScore}/50</span>
        </div>
        ${data.cefrLevel ? `
        <div class="info-row">
          <span class="info-label">Trình độ quy đổi:</span>
          <span class="info-value" style="color:#4f46e5; font-size:15px;">CEFR ${data.cefrLevel}</span>
        </div>` : ''}
        ${data.teacherNotes ? `
        <div style="padding-top:10px; margin-top:10px; border-top:1px dashed #e2e8f0;">
          <span class="info-label">Nhận xét của Giảng viên:</span>
          <p style="margin:6px 0 0; font-size:14px; font-style:italic; color:#334155;">"${data.teacherNotes}"</p>
        </div>` : ''}
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${detailUrl}" class="email-btn" target="_blank">Xem Báo Cáo &amp; Sửa Lỗi Chi Tiết</a>
      </div>
    `;

    await this.sendMail({
      to: toEmail,
      subject: `[Aptis Kỳ Tích] Kết quả chấm bài thi: ${data.examTitle}`,
      html: this.wrapEmailTemplate('Kết quả chấm thi', bodyContent),
      text: `Xin chào ${data.fullName}, bài thi ${data.examTitle} đã được chấm điểm (${data.totalScore} điểm). Xem chi tiết tại: ${detailUrl}`,
    });
  }

  /**
   * 4. Gửi email Xác nhận kích hoạt gói Pro / VIP thành công
   */
  async sendVipActivatedEmail(toEmail: string, data: {
    fullName: string;
    planName: string;
    endDate: Date | string;
    aiQuota: number;
    teacherQuota: number;
  }): Promise<void> {
    const practiceUrl = `${this.frontendUrl}/thi-thu`;
    const formattedDate = new Date(data.endDate).toLocaleDateString('vi-VN');

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Kích hoạt gói VIP thành công!</h2>
      <p>Xin chào <strong>${data.fullName}</strong>,</p>
      <p>Cảm ơn bạn đã tin tưởng nâng cấp gói học tập tại <strong>Aptis Kỳ Tích</strong>. Quyền lợi tài khoản của bạn đã được kích hoạt ngay lập tức.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Gói dịch vụ:</span>
          <span class="info-value" style="color:#4f46e5;">${data.planName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hạn sử dụng đến:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lượt AI chấm Speaking &amp; Writing:</span>
          <span class="info-value">${data.aiQuota} lượt</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lượt Giảng viên chấm chuyên sâu:</span>
          <span class="info-value">${data.teacherQuota} lượt</span>
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${practiceUrl}" class="email-btn" target="_blank">Luyện Đề VIP Ngay</a>
      </div>
    `;

    await this.sendMail({
      to: toEmail,
      subject: `[Aptis Kỳ Tích] Xác nhận kích hoạt thành công gói ${data.planName}`,
      html: this.wrapEmailTemplate('Kích hoạt VIP', bodyContent),
      text: `Xin chào ${data.fullName}, gói ${data.planName} của bạn đã được kích hoạt thành công đến ngày ${formattedDate}.`,
    });
  }

  /**
   * 5. Gửi email Cảnh báo Khẩn cấp tới Admin (Khiếu nại chuyển khoản, lỗi hệ thống)
   */
  async sendAdminAlertEmail(subject: string, message: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'aptiskytich.admin@gmail.com';

    const bodyContent = `
      <h2 style="margin-top:0; color:#dc2626; font-size:18px;">CẢNH BÁO QUẢN TRỊ HỆ THỐNG</h2>
      <div class="info-box" style="border-left: 4px solid #dc2626;">
        <p style="margin:0; font-size:14px; white-space:pre-wrap; color:#1e293b;">${message}</p>
      </div>
      <p style="font-size:12px; color:#64748b;">Thời gian phát sinh: ${new Date().toLocaleString('vi-VN')}</p>
    `;

    await this.sendMail({
      to: adminEmail,
      subject: `[ADMIN ALERT] ${subject}`,
      html: this.wrapEmailTemplate('Cảnh báo quản trị', bodyContent),
      text: message,
    });
  }

  /**
   * 6. Dựng nội dung email thông báo AI đã chấm xong bài thi Speaking/Writing
   * (tách riêng để hàng đợi email có thể gửi và retry khi lỗi)
   */
  buildAiGradedMail(toEmail: string, data: {
    fullName: string;
    examTitle: string;
    totalScore: number | string;
    cefrLevel?: string;
    submissionId: string;
    maxScore?: number;
  }): SendMailOptions {
    const detailUrl = `${this.frontendUrl}/history`;

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">AI đã chấm xong bài thi của bạn!</h2>
      <p>Xin chào <strong>${data.fullName}</strong>,</p>
      <p>Hệ thống AI vừa hoàn tất chấm điểm và nhận xét chi tiết bài thi của bạn.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Đề thi:</span>
          <span class="info-value">${data.examTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Điểm tổng kết:</span>
          <span class="info-value" style="color:#059669; font-size:16px;">${data.totalScore}/${data.maxScore ?? 50}</span>
        </div>
        ${data.cefrLevel ? `
        <div class="info-row">
          <span class="info-label">Trình độ quy đổi:</span>
          <span class="info-value" style="color:#4f46e5; font-size:15px;">CEFR ${data.cefrLevel}</span>
        </div>` : ''}
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${detailUrl}" class="email-btn" target="_blank">Xem Kết Quả Chi Tiết</a>
      </div>
    `;

    return {
      to: toEmail,
      subject: `[Aptis Kỳ Tích] AI đã chấm xong bài thi: ${data.examTitle}`,
      html: this.wrapEmailTemplate('Kết quả chấm AI', bodyContent),
      text: `Xin chào ${data.fullName}, AI đã chấm xong bài thi ${data.examTitle} (${data.totalScore} điểm). Xem chi tiết tại: ${detailUrl}`,
      priority: 'low',
    };
  }

  /**
   * 6b. Dựng nội dung email nhắc gói VIP sắp hết hạn (1 ngày trước khi hết hạn) - mức ưu tiên 'low' (tuân thủ ngân sách 80/100)
   */
  buildVipExpiringMail(
    toEmail: string,
    data: {
      fullName: string;
      planName: string;
      endDate: Date | string;
      aiQuotaLeft: number;
    }
  ): SendMailOptions {
    const pricingUrl = `${this.frontendUrl}/pricing`;
    const formattedDate = new Date(data.endDate).toLocaleDateString('vi-VN');

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Gói VIP của bạn sắp hết hạn vào ngày mai</h2>
      <p>Xin chào <strong>${data.fullName}</strong>,</p>
      <p>Hệ thống ghi nhận gói học tập <strong>${data.planName}</strong> của bạn sẽ hết hạn vào ngày <strong>${formattedDate}</strong>.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Gói hiện tại:</span>
          <span class="info-value">${data.planName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày hết hạn:</span>
          <span class="info-value" style="color:#dc2626;">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lượt AI chấm còn lại:</span>
          <span class="info-value">${data.aiQuotaLeft} lượt</span>
        </div>
      </div>
      <p>Bạn hãy tranh thủ sử dụng hết lượt chấm AI hoặc gia hạn sớm để quá trình ôn thi không bị gián đoạn.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${pricingUrl}" class="email-btn" target="_blank">Gia Hạn Hoặc Luyện Tập Ngay</a>
      </div>
    `;

    return {
      to: toEmail,
      subject: `[Aptis Kỳ Tích] Gói ${data.planName} của bạn sẽ hết hạn vào ngày ${formattedDate}`,
      html: this.wrapEmailTemplate('Nhắc hạn gói VIP', bodyContent),
      text: `Xin chào ${data.fullName}, gói ${data.planName} của bạn sẽ hết hạn vào ngày ${formattedDate}. Gia hạn tại: ${pricingUrl}`,
      priority: 'low',
    };
  }

  async sendAiGradedEmail(toEmail: string, data: {
    fullName: string;
    examTitle: string;
    totalScore: number | string;
    cefrLevel?: string;
    submissionId: string;
    maxScore?: number;
  }): Promise<void> {
    await this.sendMail(this.buildAiGradedMail(toEmail, data));
  }

  /**
   * 7. Email thông báo tổng quát (dùng cho các luồng bắt buộc: bảo mật tài khoản, thanh toán, khóa/mở khóa...)
   * Nội dung dựng từ tiêu đề + các đoạn văn + nút hành động tùy chọn.
   */
  async sendNotificationEmail(
    toEmail: string,
    data: {
      subject: string;
      heading: string;
      fullName?: string;
      paragraphs: string[];
      ctaLabel?: string;
      ctaPath?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const ctaUrl = data.ctaPath ? `${this.frontendUrl}${data.ctaPath}` : '';

    const bodyContent = `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">${esc(data.heading)}</h2>
      <p>Xin chào <strong>${esc(data.fullName || 'Học viên')}</strong>,</p>
      ${data.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      ${
        ctaUrl && data.ctaLabel
          ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${ctaUrl}" class="email-btn" target="_blank">${esc(data.ctaLabel)}</a>
      </div>`
          : ''
      }
    `;

    return this.sendMail({
      to: toEmail,
      subject: `[Aptis Kỳ Tích] ${data.subject}`,
      html: this.wrapEmailTemplate(data.heading, bodyContent),
      text: `Xin chào ${data.fullName || 'Học viên'}, ${data.paragraphs.join(' ')}${ctaUrl ? ` Chi tiết: ${ctaUrl}` : ''}`,
    });
  }
}

export const emailService = new EmailService();
