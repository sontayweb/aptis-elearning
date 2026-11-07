import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { notificationService } from './notification.service';
import { emailService } from '../email/email.service';

export interface NotifyUserOptions {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  /** Đường dẫn trong web mà chuông sẽ mở khi bấm (ví dụ: /profile) */
  link?: string;
  /**
   * Gửi kèm email (chỉ dùng cho các luồng BẮT BUỘC: bảo mật, thanh toán, khóa tài khoản...).
   * Bỏ qua trường này nếu chỉ cần thông báo chuông.
   */
  email?: {
    subject: string;
    heading?: string;
    paragraphs?: string[];
    ctaLabel?: string;
    ctaPath?: string;
  };
}

/**
 * Bắn thông báo chuông (+ email tùy chọn) cho 1 người dùng.
 * Không bao giờ ném lỗi: lỗi thông báo không được làm hỏng nghiệp vụ chính.
 */
export async function notifyUser(options: NotifyUserOptions): Promise<void> {
  try {
    await notificationService
      .createNotification({
        userId: options.userId,
        type: options.type || NotificationType.SYSTEM,
        title: options.title,
        message: options.message,
        link: options.link,
      })
      .catch((err: any) => console.error('[notifyUser] Lỗi tạo thông báo chuông:', err?.message || err));

    if (options.email) {
      const user = await prisma.user.findUnique({
        where: { id: options.userId },
        select: { email: true, full_name: true },
      });
      if (user?.email) {
        const result = await emailService.sendNotificationEmail(user.email, {
          subject: options.email.subject,
          heading: options.email.heading || options.title,
          fullName: user.full_name || undefined,
          paragraphs: options.email.paragraphs || [options.message],
          ctaLabel: options.email.ctaLabel,
          ctaPath: options.email.ctaPath,
        });
        if (!result.success) {
          console.error(`[notifyUser] Gửi email thất bại tới ${user.email}: ${result.error}`);
        }
      }
    }
  } catch (err: any) {
    console.error('[notifyUser] Lỗi không mong muốn:', err?.message || err);
  }
}

