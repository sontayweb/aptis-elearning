import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.guard';
import { sendError } from '../utils/api-response';

export const roleGuard = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Yêu cầu xác thực tài khoản', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      sendError(res, 'Bạn không có quyền truy cập chức năng này', 403);
      return;
    }

    next();
  };
};
