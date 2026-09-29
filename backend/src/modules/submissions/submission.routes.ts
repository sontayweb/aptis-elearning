import { Router } from 'express';
import { submissionController } from './submission.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { uploadAudioMiddleware } from '../../middlewares/upload.middleware';

const router = Router();

// Tất cả các route thi cử đều yêu cầu đăng nhập
router.use(authGuard);

router.post('/', (req, res, next) => submissionController.start(req, res, next));
router.put('/:id/autosave', (req, res, next) => submissionController.autosave(req, res, next));
router.post('/:id/heartbeat', (req, res, next) => submissionController.heartbeat(req, res, next));
router.get('/:id/resume', (req, res, next) => submissionController.resume(req, res, next));
router.post('/:id/submit', (req, res, next) => submissionController.submit(req, res, next));
router.get('/my-history', (req, res, next) => submissionController.myHistory(req, res, next));
router.get('/:id', (req, res, next) => submissionController.detail(req, res, next));

// Luồng Audio dành cho Speaking: Upload file thu âm & HTTP Range Streaming Proxy
router.post('/:id/answers/:questionId/audio', uploadAudioMiddleware.single('audio'), (req, res, next) =>
  submissionController.uploadAudio(req, res, next)
);
router.get('/:id/audio/:questionId', (req, res, next) =>
  submissionController.streamAudio(req, res, next)
);

export default router;
