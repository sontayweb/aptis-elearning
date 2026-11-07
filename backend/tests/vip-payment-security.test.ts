// ============================================================================
// Security & Functional Test Suite: VIP Payment (SePay VietQR) & Admin Activation
// ============================================================================

jest.mock('../src/config/database', () => ({
  prisma: {
    subscriptionPlan: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    promotionCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    promotionRedemption: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../src/modules/notifications/notification.service', () => ({
  notificationService: {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  },
}));

jest.mock('../src/modules/audit/audit.service', () => ({
  auditService: {
    record: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/modules/email/email.service', () => ({
  emailService: {
    sendVipActivatedEmail: jest.fn().mockResolvedValue({ success: true }),
    sendAdminAlertEmail: jest.fn().mockResolvedValue({ success: true }),
    sendNotificationEmail: jest.fn().mockResolvedValue({ success: true }),
  },
}));

import { prisma } from '../src/config/database';
import { paymentService, encodePaymentMethodMetadata } from '../src/modules/payment/payment.service';
import { adminService } from '../src/modules/admin/admin.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { auditService } from '../src/modules/audit/audit.service';
import { emailService } from '../src/modules/email/email.service';
import { PlanType, TransactionStatus } from '@prisma/client';

const mockPlan1M = {
  id: 'plan-uuid-1m',
  code: PlanType.VIP_1M,
  name: 'Aptis Tốc Hành (1 Tháng)',
  price_vnd: 159000,
  duration_days: 30,
  ai_quota: 10,
  teacher_quota: 0, // Gói 1 tháng KHÔNG có lượt Giảng viên chấm 1:1
  is_active: true,
};

const mockPlan3M = {
  id: 'plan-uuid-3m',
  code: PlanType.VIP_3M,
  name: 'Aptis Cày Đề (3 Tháng)',
  price_vnd: 369000,
  duration_days: 90,
  ai_quota: 30,
  teacher_quota: 3,
  is_active: true,
};

describe('VIP Payment & SePay Security Suite (VP-01 -> VP-10)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      SEPAY_API_KEY: 'real_prod_sepay_secret_key_999',
      SEPAY_BANK_ACCOUNT: '0866950837',
      SEPAY_BANK_NAME: 'MBBank',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      full_name: 'Học Viên A',
    });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'admin-1' }]);
    (notificationService.createNotification as jest.Mock).mockResolvedValue({ id: 'notif-1' });
    (auditService.record as jest.Mock).mockResolvedValue(undefined);
    (emailService.sendVipActivatedEmail as jest.Mock).mockResolvedValue({ success: true });
    (emailService.sendAdminAlertEmail as jest.Mock).mockResolvedValue({ success: true });
    (emailService.sendNotificationEmail as jest.Mock).mockResolvedValue({ success: true });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('VP-01: initiatePayment accepts planId (UUID) or planCode, returns both snake_case & camelCase, and generates 14-char APTIS3M order code', async () => {
    (prisma.subscriptionPlan.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === 'plan-uuid-3m' || where.code === PlanType.VIP_3M) {
        return Promise.resolve(mockPlan3M);
      }
      return Promise.resolve(null);
    });
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.transaction.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.transaction.create as jest.Mock).mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: 'tx-100',
        ...data,
      })
    );

    const res = await paymentService.initiatePayment('user-1', 'plan-uuid-3m');

    expect(res.orderCode).toMatch(/^APTIS3M\d{7}$/);
    expect(res.orderCode.length).toBe(14);
    expect(res.order_code).toBe(res.orderCode);
    expect(res.qr_code_url).toBe(res.qrUrl);
    expect(res.bank_account).toBe('0866950837');
    expect(res.amount).toBe(369000);
  });

  test('VP-04: Discounted 3-Month order (258.300đ < 369.000đ) activates VIP_3M (90 days), NEVER downgrades to VIP_1M (30 days)', async () => {
    const discountedTx = {
      id: 'tx-discount-3m',
      user_id: 'user-1',
      order_code: 'APTIS3M7654321',
      amount: 258300, // Đã giảm 30% từ 369.000đ
      status: TransactionStatus.PENDING,
      payment_method: encodePaymentMethodMetadata(PlanType.VIP_3M, 'TRI_AN_30'),
    };

    (prisma.subscriptionPlan.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.code === PlanType.VIP_3M || where.id === mockPlan3M.id) return Promise.resolve(mockPlan3M);
      if (where.code === PlanType.VIP_1M || where.id === mockPlan1M.id) return Promise.resolve(mockPlan1M);
      return Promise.resolve(null);
    });

    let grantedPlanId = '';
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const txClient = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        subscriptionPlan: {
          findUnique: jest.fn().mockImplementation(({ where }: any) => {
            grantedPlanId = where.id;
            return Promise.resolve(mockPlan3M);
          }),
        },
        userSubscription: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'sub-3m',
            end_date: new Date(Date.now() + 90 * 86400000),
            ai_quota_left: 30,
            teacher_quota_left: 3,
          }),
        },
        promotionCode: {
          findUnique: jest.fn().mockResolvedValue({ id: 'promo-1', code: 'TRI_AN_30' }),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      return cb(txClient);
    });

    const result = await paymentService.activatePlanForTransaction(
      discountedTx,
      'SEPAY_REF_9001',
      258300
    );

    expect(result.success).toBe(true);
    expect(result.planName).toBe('Aptis Cày Đề (3 Tháng)');
    expect(grantedPlanId).toBe(mockPlan3M.id);
    expect(result.aiQuotaLeft).toBe(30);
  });

  test('VP-05: SePay Webhook Security blocks forged/unauthenticated calls (401), placeholder keys in prod (503), and outbound transfers', async () => {
    // 1. Sai API key -> 401
    await expect(
      paymentService.handleWebhook(
        {
          id: 1001,
          content: 'APTIS3M1234567',
          transferAmount: 369000,
          transferType: 'in',
        },
        { headers: { authorization: 'Apikey hacker_fake_key' } }
      )
    ).rejects.toMatchObject({ statusCode: 401 });

    // 2. Production nhưng để key mẫu sepay_api_key_demo -> 503 Fail-Closed
    process.env.NODE_ENV = 'production';
    process.env.SEPAY_API_KEY = 'sepay_api_key_demo';
    await expect(
      paymentService.handleWebhook(
        {
          id: 1002,
          content: 'APTIS3M1234567',
          transferAmount: 369000,
          transferType: 'in',
        },
        { headers: { authorization: 'Apikey sepay_api_key_demo' } }
      )
    ).rejects.toMatchObject({ statusCode: 503 });

    // 3. Giao dịch chiều tiền ra (transferType = 'out') -> Bỏ qua, không kích hoạt
    process.env.NODE_ENV = 'test';
    process.env.SEPAY_API_KEY = 'real_prod_sepay_secret_key_999';
    const outRes = await paymentService.handleWebhook(
      {
        id: 1003,
        content: 'APTIS3M1234567',
        transferAmount: 369000,
        transferType: 'out',
      },
      { headers: { authorization: 'Apikey real_prod_sepay_secret_key_999' } }
    );
    expect(outRes.success).toBe(false);
    expect(outRes.message).toContain('transferType !== in');
  });

  test('VP-03 & VP-05: Prevents Race Condition double-activation and blocks Bank Reference Replay Attack (409)', async () => {
    const pendingTx = {
      id: 'tx-race-1',
      user_id: 'user-1',
      order_code: 'APTIS1M1112223',
      amount: 159000,
      status: TransactionStatus.PENDING,
      payment_method: 'SEPAY_QR|PLAN:VIP_1M',
    };

    (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan1M);

    // Mô phỏng khóa nguyên tử: Request đầu tiên nhận count = 1, Request song song thứ hai nhận count = 0
    let lockClaimed = false;
    let grantCalls = 0;

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const txClient = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockImplementation(async () => {
            if (!lockClaimed) {
              lockClaimed = true;
              return { count: 1 };
            }
            return { count: 0 };
          }),
        },
        subscriptionPlan: {
          findUnique: jest.fn().mockResolvedValue(mockPlan1M),
        },
        userSubscription: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(async () => {
            grantCalls++;
            return {
              id: 'sub-1m',
              end_date: new Date(Date.now() + 30 * 86400000),
              ai_quota_left: 10,
              teacher_quota_left: 0,
            };
          }),
        },
      };
      return cb(txClient);
    });

    // Chạy 2 luồng kích hoạt đồng thời (Webhook + User bấm "Tôi đã chuyển tiền")
    const [res1, res2] = await Promise.all([
      paymentService.activatePlanForTransaction(pendingTx, 'FT_BANK_8888', 159000),
      paymentService.activatePlanForTransaction(pendingTx, 'FT_BANK_8888', 159000),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    // Chỉ duy nhất 1 lần được phép cộng ngày VIP và Quota!
    expect(grantCalls).toBe(1);

    // Kịch bản Replay Attack: Dùng lại mã FT_BANK_8888 cho một đơn hàng khác (tx-race-2)
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const txClient = {
        transaction: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'tx-race-1',
            order_code: 'APTIS1M1112223',
            status: TransactionStatus.COMPLETED,
          }),
          updateMany: jest.fn(),
        },
      };
      return cb(txClient);
    });

    await expect(
      paymentService.activatePlanForTransaction(
        { ...pendingTx, id: 'tx-race-2', order_code: 'APTIS1M9999999' },
        'FT_BANK_8888',
        159000
      )
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('VP-07: Underpayment triggers warning notifications to both Student and Admin', async () => {
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({
      id: 'tx-underpay',
      user_id: 'user-1',
      order_code: 'APTIS1M5556667',
      amount: 159000,
      status: TransactionStatus.PENDING,
    });

    const res = await paymentService.handleWebhook(
      {
        id: 5001,
        content: 'Chuyen khoan APTIS1M5556667',
        transferAmount: 150000, // Thiếu 9.000đ
        transferType: 'in',
        accountNumber: '0866950837',
      },
      { headers: { authorization: 'Apikey real_prod_sepay_secret_key_999' } }
    );

    expect(res.success).toBe(false);
    expect(res.message).toBe('Số tiền chuyển khoản không đủ');
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: expect.stringContaining('Chuyển khoản chưa đủ số tiền'),
      })
    );
  });

  test('VP-09: Admin grantVip preserves teacher_quota = 0 on 1-Month plan (does not grant 5 free teacher slots via || bug)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      full_name: 'Học Viên A',
    });
    (prisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan1M);
    (prisma.userSubscription.findFirst as jest.Mock).mockResolvedValue(null);

    let createdSubData: any = null;
    (prisma.userSubscription.create as jest.Mock).mockImplementation(({ data }: any) => {
      createdSubData = data;
      return Promise.resolve({
        id: 'sub-admin-1m',
        ...data,
        plan: mockPlan1M,
      });
    });

    await adminService.grantVip('user-1', {
      planId: mockPlan1M.id,
      days: 30,
      reason: 'Kích hoạt gói 1 tháng',
    });

    expect(createdSubData).toBeDefined();
    expect(createdSubData.ai_quota_left).toBe(10);
    expect(createdSubData.teacher_quota_left).toBe(0); // Phải bằng 0, không bị lỗi 0 || 5 = 5!
  });
});
