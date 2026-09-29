import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { NotificationType } from '@prisma/client';

describe('--- MODULE 10: NOTIFICATIONS SYSTEM TESTS ---', () => {
  let user1Token = '';
  let user1Id = '';
  let user2Token = '';
  let user2Id = '';
  let noti1Id = '';
  let noti2Id = '';

  beforeAll(async () => {
    // Tạo 2 user test
    const u1 = await request(app).post('/api/auth/register').send({
      email: `noti_user1_${Date.now()}@aptiskytich.vn`,
      password: 'Password123!',
      fullName: 'Người Dùng Nhận Thông Báo 1',
    });
    user1Token = u1.body.data.tokens.accessToken;
    user1Id = u1.body.data.user.id;

    const u2 = await request(app).post('/api/auth/register').send({
      email: `noti_user2_${Date.now()}@aptiskytich.vn`,
      password: 'Password123!',
      fullName: 'Người Dùng Nhận Thông Báo 2',
    });
    user2Token = u2.body.data.tokens.accessToken;
    user2Id = u2.body.data.user.id;

    // Seed 2 thông báo cho user 1
    const n1 = await prisma.notification.create({
      data: {
        user_id: user1Id,
        title: 'Chào mừng bạn đến với Aptis Kỳ Tích 🎉',
        message: 'Bắt đầu luyện tập ngay với hơn 860 bộ đề thi chuẩn British Council.',
        type: NotificationType.SYSTEM,
        link: '/thi-thu',
      },
    });
    noti1Id = n1.id;

    const n2 = await prisma.notification.create({
      data: {
        user_id: user1Id,
        title: 'Bài thi Speaking đã có kết quả chấm 📝',
        message: 'Điểm số của bạn: 42/50 (CEFR B2).',
        type: NotificationType.EXAM_GRADED,
        link: '/history',
      },
    });
    noti2Id = n2.id;
  });

  afterAll(async () => {
    if (user1Id) {
      await prisma.notification.deleteMany({ where: { user_id: user1Id } });
      await prisma.user.delete({ where: { id: user1Id } });
    }
    if (user2Id) {
      await prisma.notification.deleteMany({ where: { user_id: user2Id } });
      await prisma.user.delete({ where: { id: user2Id } });
    }
  });

  describe('1. GET /api/notifications', () => {
    it('Nên từ chối nếu chưa đăng nhập (401)', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('Nên lấy danh sách thông báo và đếm đúng số lượng chưa đọc', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.unreadCount).toBe(2);
      expect(res.body.data[0].id).toBeDefined();
      expect(res.body.data[0].is_read).toBe(false);
    });

    it('Nên trả về danh sách rỗng nếu user mới chưa có thông báo', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.unreadCount).toBe(0);
    });
  });

  describe('2. GET /api/notifications/unread-count', () => {
    it('Nên trả về số thông báo chưa đọc chính xác', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });
  });

  describe('3. PATCH /api/notifications/:id/read', () => {
    it('Nên từ chối đánh dấu đã đọc nếu không phải chủ sở hữu thông báo (IDOR Protection)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${noti1Id}/read`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it('Nên đánh dấu đã đọc thành công 1 thông báo', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${noti1Id}/read`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_read).toBe(true);

      // Kiểm tra lại unread count giảm còn 1
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(countRes.body.data.unreadCount).toBe(1);
    });
  });

  describe('4. PATCH /api/notifications/read-all', () => {
    it('Nên đánh dấu toàn bộ thông báo là đã đọc', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(1);

      // Unread count nay phải bằng 0
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });
});
