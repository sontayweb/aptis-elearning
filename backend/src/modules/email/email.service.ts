import nodemailer, { Transporter } from 'nodemailer';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private frontendUrl: string;
  private fromSender: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.fromSender = process.env.SMTP_FROM || `"APTIS KỲ TÍCH" <${process.env.SMTP_USER || 'no-reply@aptiskytich.vn'}>`;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Kiểm tra cấu hình SMTP khả dụng
    if (user && pass && !pass.includes('your-app-password') && !pass.includes('xxxx')) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.isConfigured = true;
      console.log(`[EmailService] SMTP Transporter configured (${host}:${port}) for ${user}`);
    } else {
      this.isConfigured = false;
      console.log(`[EmailService] SMTP credentials not set or using placeholder. Running in DEV/LOG mode.`);
    }
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
   * Hàm cốt lõi gửi email (bọc try-catch, non-blocking, hỗ trợ mock log)
   */
  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log(`[EmailService MOCK-LOG] To: ${options.to} | Subject: "${options.subject}"`);

        // Ghi Audit Log chế độ Dev/Mock để Quản trị viên nắm bắt
        auditService.record({
          action: AuditAction.EMAIL_NOTIFICATION_SENT,
          entityType: 'EMAIL',
          entityId: `mock-${Date.now()}`,
          description: `[EMAIL MOCK-DEV] Giả lập gửi email tới ${options.to}: "${options.subject}" (Hệ thống đang chạy chế độ Dev hoặc chưa nạp SMTP App Password)`,
          newValue: {
            to: options.to,
            subject: options.subject,
            status: 'MOCK_DEV',
            sentAt: new Date(),
          },
          systemActor: {
            name: 'Hệ thống Email',
            email: 'mailer@aptiskytich.vn',
            role: 'SYSTEM',
          },
        }).catch(() => {});

        return { success: true, messageId: `mock-${Date.now()}` };
      }

      const info = await this.transporter.sendMail({
        from: this.fromSender,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`[EmailService SUCCESS] Mail sent to ${options.to}. MessageId: ${info.messageId}`);

      // Ghi Audit Log gửi mail thành công vào cơ sở dữ liệu
      auditService.record({
        action: AuditAction.EMAIL_NOTIFICATION_SENT,
        entityType: 'EMAIL',
        entityId: info.messageId || `mail-${Date.now()}`,
        description: `[EMAIL THÀNH CÔNG] Đã gửi email tới ${options.to}: "${options.subject}"`,
        newValue: {
          to: options.to,
          subject: options.subject,
          status: 'SENT_SUCCESS',
          messageId: info.messageId,
          sentAt: new Date(),
        },
        systemActor: {
          name: 'Hệ thống Email',
          email: 'mailer@aptiskytich.vn',
          role: 'SYSTEM',
        },
      }).catch(() => {});

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EmailService ERROR] Failed to send email to ${options.to}:`, err.message);

      // Ghi Audit Log cảnh báo gửi mail thất bại
      auditService.record({
        action: AuditAction.EMAIL_NOTIFICATION_SENT,
        entityType: 'EMAIL',
        entityId: `fail-${Date.now()}`,
        description: `[EMAIL THẤT BẠI] Lỗi gửi email tới ${options.to}: "${options.subject}". Lỗi: ${err.message}`,
        newValue: {
          to: options.to,
          subject: options.subject,
          status: 'SENT_FAILED',
          error: err.message,
          failedAt: new Date(),
        },
        systemActor: {
          name: 'Hệ thống Email',
          email: 'mailer@aptiskytich.vn',
          role: 'SYSTEM',
        },
      }).catch(() => {});

      return { success: false, error: err.message };
    }
  }

  /**
   * 1. Gửi email Đặt lại mật khẩu (Password Reset)
   */
  async sendPasswordResetEmail(toEmail: string, resetToken: string, fullName?: string): Promise<void> {
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
          ⚠️ <strong>Lưu ý bảo mật:</strong><br>
          • Đường dẫn này chỉ có hiệu lực trong vòng <strong>60 phút</strong> kể từ khi yêu cầu.<br>
          • Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn tuyệt đối.
        </p>
      </div>

      <p style="font-size:12px; color:#94a3b8; word-break:break-all;">
        Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết này vào trình duyệt: <br>
        <a href="${resetUrl}" style="color:#4f46e5;">${resetUrl}</a>
      </p>
    `;

    await this.sendMail({
      to: toEmail,
      subject: '🔑 [Aptis Kỳ Tích] Hướng dẫn đặt lại mật khẩu tài khoản',
      html: this.wrapEmailTemplate('Đặt lại mật khẩu', bodyContent),
      text: `Xin chào ${recipientName}, truy cập link sau để đặt lại mật khẩu: ${resetUrl}`,
    });
  }

  /**
   * 2. Gửi email Chào mừng & Cấp tài khoản mới (Bulk Import / Admin tạo)
   */
  async sendAccountCreatedEmail(toEmail: string, tempPassword: string, fullName: string, role: string = 'STUDENT'): Promise<void> {
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
        💡 <strong>Khuyến nghị:</strong> Sau khi đăng nhập lần đầu tiên, bạn nên vào mục <em>Hồ sơ cá nhân &rarr; Đổi mật khẩu</em> để đảm bảo an toàn cho tài khoản.
      </p>
    `;

    await this.sendMail({
      to: toEmail,
      subject: '🎉 [Aptis Kỳ Tích] Thông tin tài khoản học tập của bạn',
      html: this.wrapEmailTemplate('Tài khoản mới', bodyContent),
      text: `Xin chào ${fullName}, tài khoản Aptis Kỳ Tích của bạn đã được tạo. Email: ${toEmail}, Mật khẩu: ${tempPassword}. Đăng nhập tại: ${loginUrl}`,
    });
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
      subject: `🎯 [Aptis Kỳ Tích] Kết quả chấm bài thi: ${data.examTitle}`,
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
      subject: `🌟 [Aptis Kỳ Tích] Xác nhận kích hoạt thành công gói ${data.planName}`,
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
      <h2 style="margin-top:0; color:#dc2626; font-size:18px;">⚠️ CẢNH BÁO QUẢN TRỊ HỆ THỐNG</h2>
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
}

export const emailService = new EmailService();
