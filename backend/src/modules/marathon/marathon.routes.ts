import { Router } from 'express';
import { marathonController } from './marathon.controller';
import { optionalAuthGuard, authGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public / Guest accessible
router.get('/catalog', optionalAuthGuard, (req, res) => marathonController.getCatalog(req, res));
router.get('/batch', optionalAuthGuard, (req, res) => marathonController.getBatch(req, res));
router.get('/progress', optionalAuthGuard, (req, res) => marathonController.getProgress(req, res));

// Autosave (nếu có token thì lưu DB, không thì 200)
router.post('/progress/autosave', optionalAuthGuard, (req, res) => marathonController.autosave(req, res));

// Hoàn thành đề & Reset (yêu cầu đăng nhập để đồng bộ dữ liệu)
router.post('/progress/complete-exam', authGuard, (req, res) => marathonController.completeExam(req, res));
router.post('/progress/reset', authGuard, (req, res) => marathonController.reset(req, res));

export default router;

