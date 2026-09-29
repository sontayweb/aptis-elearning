import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { notificationFilterSchema } from './notification.dto';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class NotificationController {
  async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filter = notificationFilterSchema.parse(req.query);
      const result = await notificationService.getMyNotifications(userId, filter);
      sendSuccess(res, result.items, 'Lấy danh sách thông báo thành công', 200, {
        unreadCount: result.unreadCount,
        ...result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.getUnreadCount(userId);
      sendSuccess(res, result, 'Lấy số lượng thông báo chưa đọc thành công');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await notificationService.markAsRead(userId, id);
      sendSuccess(res, result, 'Đã đánh dấu thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAllAsRead(userId);
      sendSuccess(res, result, 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
