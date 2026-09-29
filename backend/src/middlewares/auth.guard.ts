import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import { sendError } from '../utils/api-response';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authGuard = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Yêu cầu đăng nhập để truy cập tài nguyên này', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    sendError(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ', 401, err.message);
  }
};

export const optionalAuthGuard = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch {
      // Bỏ qua lỗi token hết hạn/không hợp lệ cho guard tùy chọn
    }
  }
  next();
};

