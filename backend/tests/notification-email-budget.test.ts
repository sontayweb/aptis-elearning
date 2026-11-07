import { EmailService } from '../src/modules/email/email.service';
import { emailQueue } from '../src/modules/email/email.queue';
import { subscriptionReminderJob } from '../src/modules/notifications/subscription-reminder.job';
import { auditService } from '../src/modules/audit/audit.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'student@aptis.vn', full_name: 'Học viên A' }),
    },
    userSubscription: {
      findMany: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    notification: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    },
  },
}));

jest.mock('../src/modules/audit/audit.service', () => ({
  auditService: {
    record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  },
}));

jest.mock('../src/modules/notifications/notification.service', () => ({
  notificationService: {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  },
}));

describe('Notification & Email Standard Flows (No Mock Fallback + 80/100 Daily Budget)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'admin-1' }]);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@aptis.vn',
      full_name: 'Học viên A',
    });
    (prisma.userSubscription.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (auditService.record as jest.Mock).mockResolvedValue({ id: 'audit-1' });
    (notificationService.createNotification as jest.Mock).mockResolvedValue({ id: 'notif-1' });
  });

  it('1. Không chạy chế độ MOCK_DEV: khi thiếu cấu hình email phải báo lỗi thật và bắn chuông cho Admin', async () => {
    const prevResend = process.env.RESEND_API_KEY;
    const prevSmtpUser = process.env.SMTP_USER;
    const prevSmtpPass = process.env.SMTP_PASS;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const unconfiguredService = new EmailService();
    const res = await unconfiguredService.sendMail({
      to: 'student@aptis.vn',
      subject: 'Test No Mock',
      html: '<p>Test</p>',
    });

    process.env.RESEND_API_KEY = prevResend;
    process.env.SMTP_USER = prevSmtpUser;
    process.env.SMTP_PASS = prevSmtpPass;

    expect(res.success).toBe(false);
    expect(res.error).toContain('chưa được cấu hình hợp lệ');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        newValue: expect.objectContaining({ status: 'SENT_FAILED' }),
      })
    );
  });

  it('2. Ngân sách 80/100 email/ngày: chạm mốc 80 sẽ chặn email ưu tiên thấp (low) nhưng vẫn cho phép email bắt buộc (high)', async () => {
    jest.spyOn(emailQueue, 'getTodaySentCount').mockResolvedValue(80);
    jest.spyOn(emailQueue, 'incrementTodaySentCount').mockResolvedValue(81);

    process.env.RESEND_API_KEY = 're_test_valid_format_key';
    const service = new EmailService();
    jest.spyOn(service as any, 'sendViaResend').mockResolvedValue({ id: 'resend-msg-81' });

    // Email ưu tiên thấp (AI chấm Full Test / Nhắc hạn VIP) bị chặn tại mốc 80
    const lowRes = await service.sendMail({
      to: 'student@aptis.vn',
      subject: 'Low Priority Reminder',
      html: '<p>Low</p>',
      priority: 'low',
    });
    expect(lowRes.success).toBe(false);
    expect(lowRes.skippedByBudget).toBe(true);

    // Email bắt buộc (Xác thực / Quên mật khẩu / Biên nhận VIP) vẫn gửi bình thường trong 20 email dự phòng
    const highRes = await service.sendMail({
      to: 'student@aptis.vn',
      subject: 'High Priority Transactional',
      html: '<p>High</p>',
      priority: 'high',
    });
    expect(highRes.success).toBe(true);
    expect(highRes.messageId).toBe('resend-msg-81');
  });

  it('3. SubscriptionReminderJob (#11 & #12): tự động đóng gói hết hạn và nhắc gói sắp hết hạn <24h', async () => {
    const now = new Date();
    (prisma.userSubscription.findMany as jest.Mock)
      // Lần 1: gói đã quá hạn (#12)
      .mockResolvedValueOnce([
        {
          id: 'sub-exp-1',
          user_id: 'user-exp-1',
          end_date: new Date(now.getTime() - 3600_000),
          plan: { name: 'VIP Pro 30 Ngày' },
        },
      ])
      // Lần 2: gói sắp hết hạn trong <24h (#11)
      .mockResolvedValueOnce([
        {
          id: 'sub-soon-1',
          user_id: 'user-soon-1',
          end_date: new Date(now.getTime() + 12 * 3600_000),
          ai_quota_left: 5,
          user: { id: 'user-soon-1', email: 'soon@aptis.vn', full_name: 'Học viên B', is_active: true },
          plan: { name: 'VIP Pro 30 Ngày' },
        },
      ]);

    jest.spyOn(emailQueue, 'enqueue').mockResolvedValue(undefined);

    const stats = await subscriptionReminderJob.runOnce();
    expect(stats.expiredCount).toBe(1);
    expect(stats.expiringSoonCount).toBe(1);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(emailQueue.enqueue).toHaveBeenCalledTimes(1);
  });
});
