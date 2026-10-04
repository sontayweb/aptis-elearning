import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/api-response';

/**
 * Rate Limiter cho các endpoint xác thực (Đăng nhập, Đăng ký, Quên mật khẩu)
 * Giới hạn: 30 requests / 15 phút trên mỗi IP (đảm bảo không chặn nhầm học viên nhưng ngăn chặn Brute-force bot)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 requests / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Bạn đã gửi quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút để bảo vệ an toàn tài khoản.',
      429,
      { code: 'RATE_LIMIT_EXCEEDED' }
    );
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Rate Limiter cho các endpoint gọi AI chấm bài (Writing & Speaking)
 * Giới hạn: 10 requests / 1 phút trên mỗi IP
 */
export const aiGradingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // Tối đa 10 requests / phút
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Hệ thống AI đang xử lý đánh giá bài thi. Vui lòng chờ vài giây trước khi gửi yêu cầu tiếp theo.',
      429,
      { code: 'RATE_LIMIT_AI_EXCEEDED' }
    );
  },
  skip: () => process.env.NODE_ENV === 'test',
});
