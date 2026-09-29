import { Router } from 'express';
import { dictationController } from './dictation.controller';
import { authGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public routes (có thể kèm token nếu đã đăng nhập để lấy progress)
router.get('/levels', (req, res, next) => dictationController.getLevels(req, res, next));
router.get('/lessons', (req, res, next) => dictationController.getLessons(req, res, next));
router.get('/lessons/:id', (req, res, next) => dictationController.getLessonDetail(req, res, next));

// Protected routes (Nộp bài cần đăng nhập để lưu tiến độ)
router.post('/sentences/:id/check', authGuard, (req, res, next) =>
  dictationController.checkSentence(req, res, next)
);

export default router;
