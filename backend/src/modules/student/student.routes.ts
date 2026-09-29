import { Router } from 'express';
import { studentController } from './student.controller';
import { authGuard, optionalAuthGuard } from '../../middlewares/auth.guard';

const router = Router();

// Dashboard stats: Cho phép cả guest và user (với token sẽ trả data cá nhân)
router.get('/dashboard-stats', optionalAuthGuard, (req, res, next) =>
  studentController.getDashboardStats(req, res, next)
);

// Protected routes: Yêu cầu đăng nhập
router.get('/streak', authGuard, (req, res, next) => studentController.getStreak(req, res, next));
router.get('/goal', authGuard, (req, res, next) => studentController.getGoal(req, res, next));
router.put('/goal', authGuard, (req, res, next) => studentController.updateGoal(req, res, next));

export default router;
