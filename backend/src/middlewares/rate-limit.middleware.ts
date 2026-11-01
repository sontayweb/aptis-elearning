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

/**
 * Rate Limiter cho endpoint Autosave bài thi (/api/submissions/:id/autosave)
 * Giới hạn: 60 requests / 1 phút trên mỗi tài khoản học viên (hoặc IP)
 * Đảm bảo thoải mái cho cơ chế debounce 3s và chuyển câu, đồng thời chặn đứng bot spam liên tục.
 */
export const autosaveRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60, // Tối đa 60 lần autosave / phút / học viên
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String((req as any).user?.id || req.ip || 'anonymous'),
  handler: (_req, res) => {
    sendError(
      res,
      'Thao tác tự động lưu gửi quá nhanh. Vui lòng tiếp tục làm bài bình thường sau vài giây.',
      429,
      { code: 'RATE_LIMIT_AUTOSAVE_EXCEEDED' }
    );
  },
  skip: () => process.env.NODE_ENV === 'test',
});

