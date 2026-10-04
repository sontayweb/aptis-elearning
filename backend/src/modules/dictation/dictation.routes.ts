import { Router } from 'express';
import { dictationController } from './dictation.controller';
import { authGuard, optionalAuthGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public routes (có thể kèm token nếu đã đăng nhập để lấy progress hoặc xác thực PRO)
router.get('/levels', optionalAuthGuard, (req, res, next) => dictationController.getLevels(req, res, next));
router.get('/lessons', optionalAuthGuard, (req, res, next) => dictationController.getLessons(req, res, next));
router.get('/lessons/:id', optionalAuthGuard, (req, res, next) => dictationController.getLessonDetail(req, res, next));

// Protected routes (Nộp bài cần đăng nhập để lưu tiến độ)
router.post('/sentences/:id/check', authGuard, (req, res, next) =>
  dictationController.checkSentence(req, res, next)
);

export default router;
