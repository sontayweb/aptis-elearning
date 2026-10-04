import { Router } from 'express';
import { aiGradingController } from './ai-grading.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { aiGradingRateLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();

router.use(authGuard);

router.post('/:id/evaluate-ai', aiGradingRateLimiter, (req, res, next) =>
  aiGradingController.evaluate(req, res, next)
);
router.get('/:id/ai-feedback', (req, res, next) =>
  aiGradingController.getFeedback(req, res, next)
);

export default router;
