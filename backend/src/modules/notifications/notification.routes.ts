import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authGuard } from '../../middlewares/auth.guard';

const router = Router();

// Tất cả endpoints notifications yêu cầu đăng nhập
router.use(authGuard);

router.get('/', (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));

export default router;
