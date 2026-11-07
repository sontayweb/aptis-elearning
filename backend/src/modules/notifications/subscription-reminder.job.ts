import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { notificationService } from './notification.service';
import { emailService } from '../email/email.service';
import { emailQueue } from '../email/email.queue';

/**
 * Tác vụ định kỳ kiểm tra gói VIP của học viên (#11 & #12):
 * - #11 VIP sắp hết hạn (còn dưới 24 giờ): Bắn chuông + xếp hàng đợi email nhắc nhở 1 lần duy nhất (ưu tiên 'low', tuân thủ ngân sách 80/100 email/ngày).
 * - #12 VIP vừa hết hạn (end_date <= now & is_active = true): Chuyển is_active = false + bắn chuông thông báo (không gửi email để tiết kiệm quota).
 */
class SubscriptionReminderJob {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.timer) return;
    // Chạy lần đầu sau 30 giây khi server khởi động xong, sau đó lặp lại mỗi 6 giờ
    setTimeout(() => {
      this.runOnce().catch((err) => console.error('[SubscriptionReminderJob] Lỗi lần chạy đầu:', err));
    }, 30 * 1000);

    this.timer = setInterval(() => {
      this.runOnce().catch((err) => console.error('[SubscriptionReminderJob] Lỗi định kỳ:', err));
    }, 6 * 60 * 60 * 1000);

    console.log('[SubscriptionReminderJob] Đã kích hoạt tác vụ kiểm tra hạn gói VIP (chu kỳ 6 giờ).');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce(): Promise<{ expiredCount: number; expiringSoonCount: number }> {
    if (this.isRunning) {
      return { expiredCount: 0, expiringSoonCount: 0 };
    }
    this.isRunning = true;

    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const lookback36Hours = new Date(now.getTime() - 36 * 60 * 60 * 1000);

      // 1. Luồng #12: Các gói VIP đã quá hạn nhưng vẫn đang is_active = true
      const expiredSubs = await prisma.userSubscription.findMany({
        where: {
          is_active: true,
          end_date: { lte: now },
        },
        include: {
          plan: { select: { name: true } },
        },
        take: 200,
      });

      let expiredCount = 0;
      for (const sub of expiredSubs) {
        const updated = await prisma.userSubscription.updateMany({
          where: { id: sub.id, is_active: true },
          data: { is_active: false },
        });
        if (updated.count > 0) {
          expiredCount++;
          await notificationService
            .createNotification({
              userId: sub.user_id,
              type: NotificationType.VIP_ACTIVATED,
              title: `Gói ${sub.plan.name} của bạn đã hết hạn`,
              message: `Thời hạn sử dụng gói ${sub.plan.name} đã kết thúc. Hãy gia hạn để tiếp tục mở khóa toàn bộ đề thi VIP và lượt chấm AI.`,
              link: '/pricing',
            })
            .catch(() => {});
        }
      }

      // 2. Luồng #11: Các gói VIP sắp hết hạn trong vòng 24 giờ tới (nhắc đúng 1 lần vào ngày cuối)
      const expiringSubs = await prisma.userSubscription.findMany({
        where: {
          is_active: true,
          end_date: { gt: now, lte: in24Hours },
        },
        include: {
          user: { select: { id: true, email: true, full_name: true, is_active: true } },
          plan: { select: { name: true } },
        },
        take: 200,
      });

      let expiringSoonCount = 0;
      for (const sub of expiringSubs) {
        if (!sub.user?.is_active) continue;

        const titlePrefix = `Gói ${sub.plan.name} sắp hết hạn vào ngày mai`;
        // Chống gửi lặp: kiểm tra xem học viên đã nhận thông báo này trong 36 giờ qua chưa
        const alreadyNotified = await prisma.notification.findFirst({
          where: {
            user_id: sub.user_id,
            title: titlePrefix,
            created_at: { gte: lookback36Hours },
          },
          select: { id: true },
        });
        if (alreadyNotified) continue;

        expiringSoonCount++;
        const endDateStr = new Date(sub.end_date).toLocaleDateString('vi-VN');

        await notificationService
          .createNotification({
            userId: sub.user_id,
            type: NotificationType.VIP_ACTIVATED,
            title: titlePrefix,
            message: `Gói ${sub.plan.name} sẽ hết hạn vào ngày ${endDateStr} (còn ${sub.ai_quota_left} lượt AI). Hãy tranh thủ luyện tập hoặc gia hạn sớm.`,
            link: '/pricing',
          })
          .catch(() => {});

        if (sub.user.email) {
          await emailQueue
            .enqueue(
              emailService.buildVipExpiringMail(sub.user.email, {
                fullName: sub.user.full_name || 'Học viên',
                planName: sub.plan.name,
                endDate: sub.end_date,
                aiQuotaLeft: sub.ai_quota_left,
              })
            )
            .catch(() => {});
        }
      }

      if (expiredCount > 0 || expiringSoonCount > 0) {
        console.log(
          `[SubscriptionReminderJob] Hoàn tất quét: ${expiredCount} gói hết hạn, ${expiringSoonCount} gói sắp hết hạn (<24h).`
        );
      }

      return { expiredCount, expiringSoonCount };
    } finally {
      this.isRunning = false;
    }
  }
}

export const subscriptionReminderJob = new SubscriptionReminderJob();

