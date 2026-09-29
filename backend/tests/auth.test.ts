import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('--- MODULE 1: AUTHENTICATION MODULE TESTS ---', () => {
  const testUser = {
    email: `test_${Date.now()}@aptiskytich.vn`,
    password: 'TestPassword123!',
    fullName: 'Nguyễn Văn Test',
    phoneNumber: '0987654321',
  };

  let accessToken = '';

  beforeAll(async () => {
    // Dọn dẹp nếu email đã tồn tại
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Dọn dẹp sau khi test xong
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe('1. POST /api/auth/register', () => {
    it('Nên đăng ký thành công tài khoản mới với đầy đủ thông tin hợp lệ', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('Nên trả về 409 Conflict khi đăng ký với email đã tồn tại', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('đã được đăng ký');
    });

    it('Nên trả về 422 Unprocessable Entity khi mật khẩu < 6 ký tự', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'invalid@aptis.vn',
        password: '123',
        fullName: 'Test Short Pass',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('Nên trả về 422 khi định dạng email sai', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'validPassword123',
        fullName: 'Test Invalid Email',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. POST /api/auth/login', () => {
    it('Nên đăng nhập thành công với đúng email và mật khẩu', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

      accessToken = res.body.data.tokens.accessToken;
    });

    it('Nên trả về 401 khi sai mật khẩu', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không chính xác');
    });

    it('Nên trả về 401 khi email không tồn tại', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@aptis.vn',
        password: 'AnyPassword123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. GET /api/auth/me (Protected Route)', () => {
    it('Nên trả về thông tin profile khi có Bearer token hợp lệ', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.full_name).toBe(testUser.fullName);
    });

    it('Nên trả về 401 Unauthorized khi không gửi header Authorization', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Nên trả về 401 Unauthorized khi token không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. POST /api/auth/forgot-password & /reset-password', () => {
    let resetToken = '';

    it('Nên tạo reset token khi yêu cầu quên mật khẩu với email hợp lệ', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();

      resetToken = res.body.data.resetToken;
    });

    it('Nên đặt lại mật khẩu mới thành công với token vừa cấp', async () => {
      const newPassword = 'NewSecretPassword456!';
      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Đăng nhập lại với mật khẩu mới để kiểm chứng
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: newPassword,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('Nên từ chối dùng lại reset token lần thứ hai (Single-Use Token Guard)', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        newPassword: 'AnotherPassword789!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. POST /api/auth/refresh (Token Rotation & Session Management)', () => {
    it('Nên làm mới access token thành công với refresh token hợp lệ', async () => {
      // Đăng nhập để lấy refresh token mới nhất
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'NewSecretPassword456!',
      });

      const currentRefreshToken = loginRes.body.data.tokens.refreshToken;
      expect(currentRefreshToken).toBeDefined();

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: currentRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
    });

    it('Nên từ chối làm mới khi gửi refresh token rác hoặc sai định dạng', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_malformed_token_xyz' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. PATCH /api/auth/profile (Update Profile)', () => {
    it('Nên cập nhật thành công họ tên, số điện thoại và targetBand', async () => {
      // Đăng nhập lại để có token mới nhất
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'NewSecretPassword456!',
      });
      accessToken = loginRes.body.data.tokens.accessToken;

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'Nguyễn Văn Test Đã Đổi',
          phoneNumber: '0912345678',
          targetBand: 'B2_TARGET',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.full_name).toBe('Nguyễn Văn Test Đã Đổi');
      expect(res.body.data.phone_number).toBe('0912345678');
      expect(res.body.data.target_band).toBe('B2_TARGET');
    });

    it('Nên trả về 401 khi không có Authorization header', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .send({ fullName: 'Hack Name' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('7. POST /api/auth/change-password', () => {
    it('Nên từ chối nếu mật khẩu hiện tại không đúng', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongOldPassword123!',
          newPassword: 'BrandNewPassword999!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không chính xác');
    });

    it('Nên đổi mật khẩu thành công khi nhập đúng mật khẩu hiện tại', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewSecretPassword456!',
          newPassword: 'BrandNewPassword999!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Đăng nhập lại với mật khẩu mới để kiểm chứng
      const loginCheck = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'BrandNewPassword999!',
      });
      expect(loginCheck.status).toBe(200);
      expect(loginCheck.body.success).toBe(true);
    });
  });
});

