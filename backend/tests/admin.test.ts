import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, ExamSkill, QuestionType, TransactionStatus } from '@prisma/client';
import { generateTokens } from '../src/utils/token';

describe('--- MODULE 7: ADMIN PORTAL & MANAGEMENT TESTS ---', () => {
  let adminToken = '';
  let adminUserId = '';
  let studentToken = '';
  let createdUserId = '';
  let createdExamId = '';
  let testTxId = '';

  beforeAll(async () => {
    // 1. Tạo tài khoản Admin
    const adminEmail = `admin_test_${Date.now()}@aptiskytich.vn`;
    const adminRes = await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password: 'AdminPassword123!',
      fullName: 'Super Admin Test',
    });
    adminUserId = adminRes.body.data.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: UserRole.ADMIN },
    });

    const adminTokens = generateTokens({
      userId: adminUserId,
      email: adminEmail,
      role: 'ADMIN',
    });
    adminToken = adminTokens.accessToken;

    // 2. Tạo tài khoản Student thường
    const studentRes = await request(app).post('/api/auth/register').send({
      email: `student_no_admin_${Date.now()}@aptiskytich.vn`,
      password: 'StudentPass123!',
      fullName: 'Học Sinh Không Quyền',
    });
    studentToken = studentRes.body.data.tokens.accessToken;

    // 3. Tạo một transaction mẫu
    const tx = await prisma.transaction.create({
      data: {
        user_id: studentRes.body.data.user.id,
        order_code: `APTIS_ADMIN_TEST_${Date.now()}`,
        amount: 199000,
        status: TransactionStatus.PENDING,
      },
    });
    testTxId = tx.id;
  });

  afterAll(async () => {
    if (createdExamId) {
      await prisma.exam.deleteMany({ where: { id: createdExamId } });
    }
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    if (testTxId) {
      await prisma.transaction.deleteMany({ where: { id: testTxId } });
    }
    if (adminUserId) {
      await prisma.user.deleteMany({ where: { id: adminUserId } });
    }
  });

  describe('1. RBAC Phân Quyền Quản Trị Viên', () => {
    it('Nên từ chối học viên truy cập vào Admin API (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không có quyền');
    });

    it('Nên cho phép Admin truy cập danh sách người dùng', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Quản Lý Người Dùng (Admin User Management)', () => {
    it('Nên tạo tài khoản người dùng mới thành công', async () => {
      const newUserEmail = `created_by_admin_${Date.now()}@aptiskytich.vn`;
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: newUserEmail,
          password: 'CreatedPass123!',
          fullName: 'Nhân Viên Mới',
          role: UserRole.TEACHER,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newUserEmail);
      expect(res.body.data.role).toBe(UserRole.TEACHER);

      createdUserId = res.body.data.id;
    });

    it('Nên cập nhật trạng thái khóa/mở khóa tài khoản thành công', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_active).toBe(false);
    });
  });

  describe('3. Quản Lý Đề Thi (Admin Exam Management)', () => {
    it('Nên tạo đề thi mới với đầy đủ cấu trúc câu hỏi thành công', async () => {
      const res = await request(app)
        .post('/api/admin/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Đề Thi Quản Trị Tạo Mới 2026',
          description: 'Mô tả đề thi tạo bởi admin',
          skill: ExamSkill.READING,
          durationMinutes: 35,
          isPro: true,
          parts: [
            {
              partNumber: 1,
              title: 'Part 1: Sentence Comprehension',
              questions: [
                {
                  questionNumber: 1,
                  questionType: QuestionType.MULTIPLE_CHOICE,
                  prompt: 'Choose the best word to complete the sentence.',
                  options: ['A. book', 'B. table', 'C. river'],
                  correctAnswer: 'A',
                  explanation: 'Context requires a readable item.',
                  maxScore: 1.0,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Đề Thi Quản Trị Tạo Mới 2026');

      createdExamId = res.body.data.id;
    });

    it('Nên xóa đề thi thành công', async () => {
      const res = await request(app)
        .delete(`/api/admin/exams/${createdExamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      createdExamId = ''; // Đã xóa xong
    });
  });

  describe('4. Quản Lý Giao Dịch & Dashboard KPIs', () => {
    it('Nên lấy danh sách giao dịch SePay', async () => {
      const res = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Nên duyệt thủ công giao dịch SePay thành công', async () => {
      const res = await request(app)
        .post(`/api/admin/transactions/${testTxId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: TransactionStatus.COMPLETED,
          note: 'Duyệt bù giao dịch qua hóa đơn ngân hàng',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TransactionStatus.COMPLETED);
    });

    it('Nên lấy các chỉ số KPI thống kê toàn hệ thống đầy đủ cho Dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThan(0);
      expect(res.body.data.totalAttempts).toBeDefined();
      expect(res.body.data.totalRevenueVND).toBeDefined();
      expect(res.body.data.totalExams).toBeDefined();
      expect(res.body.data.activeUsers).toBeDefined();
      expect(Array.isArray(res.body.data.dailyAttempts)).toBe(true);
      expect(Array.isArray(res.body.data.pendingTransactions)).toBe(true);
    });
  });

  describe('5. Quản Lý Danh Sách Đề Thi & Gói Cước (Exams & Plans Management)', () => {
    it('Nên lấy danh sách đề thi kèm số câu hỏi và lượt làm', async () => {
      const res = await request(app)
        .get('/api/admin/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Nên lấy danh sách các gói cước thanh toán trong hệ thống', async () => {
      const res = await request(app)
        .get('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Nên cập nhật thông tin gói cước thành công', async () => {
      const plansRes = await request(app)
        .get('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`);

      const firstPlan = plansRes.body.data[0];
      const res = await request(app)
        .patch(`/api/admin/plans/${firstPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price_vnd: firstPlan.priceVnd,
          ai_quota: firstPlan.aiQuota + 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ai_quota).toBe(firstPlan.aiQuota + 10);
    });
  });
});
