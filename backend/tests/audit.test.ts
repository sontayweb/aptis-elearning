import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, TransactionStatus, AuditAction } from '@prisma/client';
import { generateTokens } from '../src/utils/token';

describe('--- MODULE 8: ENTERPRISE AUDIT LOG TESTS ---', () => {
  let adminToken = '';
  let adminUserId = '';
  let studentToken = '';
  let studentUserId = '';
  let testTxId = '';

  beforeAll(async () => {
    // 1. Tạo tài khoản Admin
    const adminEmail = `admin_audit_${Date.now()}@aptiskytich.vn`;
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: 'hash123',
        full_name: 'Quản Trị Viên Kiểm Toán',
        role: UserRole.ADMIN,
      },
    });
    adminUserId = adminUser.id;
    adminToken = generateTokens({
      userId: adminUserId,
      email: adminEmail,
      role: 'ADMIN',
    }).accessToken;

    // 2. Tạo tài khoản Học viên
    const studentEmail = `student_audit_${Date.now()}@aptiskytich.vn`;
    const studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        password_hash: 'hash123',
        full_name: 'Học Viên Test Audit',
        role: UserRole.STUDENT,
      },
    });
    studentUserId = studentUser.id;
    studentToken = generateTokens({
      userId: studentUserId,
      email: studentEmail,
      role: 'STUDENT',
    }).accessToken;

    // 3. Tạo 1 transaction test
    const tx = await prisma.transaction.create({
      data: {
        user_id: studentUserId,
        order_code: `APTIS_AUDIT_${Date.now()}`,
        amount: 299000,
        status: TransactionStatus.PENDING,
      },
    });
    testTxId = tx.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { user_id: adminUserId },
          { user_id: studentUserId },
        ],
      },
    });
    if (testTxId) {
      await prisma.transaction.deleteMany({ where: { id: testTxId } });
    }
    if (studentUserId) {
      await prisma.user.deleteMany({ where: { id: studentUserId } });
    }
    if (adminUserId) {
      await prisma.user.deleteMany({ where: { id: adminUserId } });
    }
  });

  describe('1. RBAC Phân Quyền Kiểm Toán', () => {
    it('Nên từ chối học viên truy cập vào Audit Logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Nên cho phép Admin truy cập danh sách Audit Logs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Tự Động Ghi Log Kiểm Toán Khi Thao Tác (Audit Instrumentation)', () => {
    it('Nên tự động ghi log khi Admin thay đổi trạng thái người dùng', async () => {
      // Admin khóa tài khoản học viên
      const patchRes = await request(app)
        .patch(`/api/admin/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(patchRes.status).toBe(200);

      // Đợi ngắn cho async non-blocking log hoàn thành
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Kiểm tra trong database có log USER_STATUS_CHANGE
      const log = await prisma.auditLog.findFirst({
        where: {
          action: AuditAction.USER_STATUS_CHANGE,
          entity_id: studentUserId,
        },
        orderBy: { created_at: 'desc' },
      });

      expect(log).toBeDefined();
      expect(log?.actor_role).toBe('ADMIN');
      expect(log?.old_value).toEqual({ is_active: true });
      expect(log?.new_value).toEqual({ is_active: false });
    });

    it('Nên tự động ghi log khi Admin duyệt khớp lệnh SePay thủ công', async () => {
      const resolveRes = await request(app)
        .post(`/api/admin/transactions/${testTxId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: TransactionStatus.COMPLETED,
          note: 'Duyệt test audit log',
        });

      expect(resolveRes.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const log = await prisma.auditLog.findFirst({
        where: {
          action: AuditAction.PAYMENT_MANUAL_RESOLVE,
          entity_id: testTxId,
        },
        orderBy: { created_at: 'desc' },
      });

      expect(log).toBeDefined();
      expect(log?.actor_role).toBe('ADMIN');
      expect(log?.description).toContain('Khớp lệnh thủ công');
    });
  });

  describe('3. Truy Vấn & Thống Kê Audit Logs', () => {
    it('Nên lọc logs theo hành động action=USER_STATUS_CHANGE', async () => {
      const res = await request(app)
        .get('/api/audit?action=USER_STATUS_CHANGE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((l: any) => l.action === 'USER_STATUS_CHANGE')).toBe(true);
    });

    it('Nên lấy thống kê số lượng log theo ngày và theo loại hành động', async () => {
      const res = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalLogs).toBeGreaterThan(0);
      expect(res.body.data.todayLogs).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.actionCounts)).toBe(true);
    });
  });
});
