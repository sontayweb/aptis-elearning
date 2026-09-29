import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { PlanType, TransactionStatus } from '@prisma/client';

describe('--- MODULE 4: PAYMENT & SEPAY SUBSCRIPTION TESTS ---', () => {
  let userToken = '';
  let testUserId = '';
  let orderCode = '';

  beforeAll(async () => {
    // Tạo user test mua gói VIP
    const userRes = await request(app).post('/api/auth/register').send({
      email: `payment_user_${Date.now()}@aptiskytich.vn`,
      password: 'PaymentPass123!',
      fullName: 'Học Viên Mua VIP',
    });

    userToken = userRes.body.data.tokens.accessToken;
    testUserId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.userSubscription.deleteMany({ where: { user_id: testUserId } });
      await prisma.transaction.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('1. GET /api/payment/plans', () => {
    it('Nên lấy danh sách các gói cước thanh toán thành công', async () => {
      const res = await request(app).get('/api/payment/plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      const codes = res.body.data.map((p: any) => p.code);
      expect(codes).toContain('FREE');
      expect(codes).toContain('VIP_1M');
      expect(codes).toContain('VIP_3M');
      expect(codes).toContain('PREMIER_6M');
    });
  });

  describe('2. POST /api/payment/initiate', () => {
    it('Nên khởi tạo đơn hàng thanh toán thành công và sinh mã QR MB Bank', async () => {
      const res = await request(app)
        .post('/api/payment/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: PlanType.VIP_3M });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBeDefined();
      expect(res.body.data.amount).toBe(399000);
      expect(res.body.data.bankAccount).toBe('0866950837');
      expect(res.body.data.qrUrl).toContain('0866950837');

      orderCode = res.body.data.orderCode;
    });

    it('Nên từ chối khởi tạo đơn với gói FREE', async () => {
      const res = await request(app)
        .post('/api/payment/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: PlanType.FREE });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. POST /api/payment/webhook (Mô phỏng SePay bắn webhook MB Bank)', () => {
    it('Nên xử lý webhook, kích hoạt gói VIP và cộng hạn ngạch Quota', async () => {
      const webhookPayload = {
        id: 99887766,
        gateway: 'MBBank',
        accountNumber: '0866950837',
        transferAmount: 399000,
        content: `Thanh toan don hang ${orderCode} qua MB Bank`,
        referenceCode: 'MBB_REF_12345678',
      };

      const res = await request(app)
        .post('/api/payment/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.aiQuotaLeft).toBe(30);
      expect(res.body.data.teacherQuotaLeft).toBe(3);

      // Kiểm tra trạng thái giao dịch trong DB
      const transaction = await prisma.transaction.findUnique({
        where: { order_code: orderCode },
      });
      expect(transaction?.status).toBe(TransactionStatus.COMPLETED);
    });

    it('Nên từ chối webhook nếu số tiền chuyển không đủ', async () => {
      const res = await request(app).post('/api/payment/webhook').send({
        content: `Thanh toan ${orderCode}`,
        transferAmount: 50000, // Cần 399000
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Nên xử lý Idempotent (chống nạp đúp) khi SePay gửi webhook lần 2 cho cùng 1 đơn hàng', async () => {
      const res = await request(app).post('/api/payment/webhook').send({
        content: `Thanh toan don hang ${orderCode} qua MB Bank`,
        transferAmount: 399000,
        referenceCode: 'MBB_REF_12345678_DUPLICATE',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Idempotent');

      // Đảm bảo quota AI không bị cộng dồn lặp thành 60
      const sub = await prisma.userSubscription.findFirst({
        where: { user_id: testUserId, is_active: true },
      });
      expect(sub?.ai_quota_left).toBe(30);
    });
  });

  describe('4. GET /api/payment/my-subscription & /transactions', () => {
    it('Nên xác nhận học viên đã được nâng cấp tài khoản VIP thành công', async () => {
      const res = await request(app)
        .get('/api/payment/my-subscription')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasActiveSubscription).toBe(true);
      expect(res.body.data.plan.code).toBe(PlanType.VIP_3M);
      expect(res.body.data.plan.aiQuotaLeft).toBe(30);
      expect(res.body.data.plan.teacherQuotaLeft).toBe(3);
    });

    it('Nên xem được lịch sử giao dịch đã hoàn thành', async () => {
      const res = await request(app)
        .get('/api/payment/transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('5. Enterprise Fault-Tolerance & Recovery (On-demand Verify & Dispute Reporting)', () => {
    it('Nên tra cứu trạng thái đơn hàng công khai thành công', async () => {
      const res = await request(app).get(`/api/payment/order-status/${orderCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order_code).toBe(orderCode);
      expect(res.body.data.status).toBe(TransactionStatus.COMPLETED);
    });

    it('Nên xác nhận thành công ngay khi học viên bấm Kiểm tra đơn đã hoàn thành', async () => {
      const res = await request(app)
        .post(`/api/payment/verify/${orderCode}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
    });

    it('Nên gửi báo cáo sự cố thanh toán (khiếu nại khẩn cấp) thành công khi gặp lỗi ngân hàng', async () => {
      const res = await request(app)
        .post(`/api/payment/report-issue/${orderCode}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bankTransId: 'FT26099998888',
          transferAmount: 399000,
          senderBank: 'Techcombank',
          note: 'Chuyển khoản lúc 12:30 nhưng ngân hàng bảo trì liên ngân hàng',
          contactPhone: '0987654321',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supportHotline).toBeDefined();
    });
  });
});

