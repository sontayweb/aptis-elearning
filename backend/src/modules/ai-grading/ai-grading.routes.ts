import { Router } from 'express';
import { aiGradingController } from './ai-grading.controller';
import { authGuard } from '../../middlewares/auth.guard';

const router = Router();

router.use(authGuard);

router.post('/:id/evaluate-ai', (req, res, next) =>
  aiGradingController.evaluate(req, res, next)
);
router.get('/:id/ai-feedback', (req, res, next) =>
  aiGradingController.getFeedback(req, res, next)
);

export default router;
