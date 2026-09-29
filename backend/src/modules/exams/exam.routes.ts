import { Router } from 'express';
import { examController } from './exam.controller';
import { authGuard, optionalAuthGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public routes (có thể kèm Bearer token để nhận diện userStatus & bestScore)
router.get('/', optionalAuthGuard, (req, res, next) => examController.list(req, res, next));
router.get('/:id', optionalAuthGuard, (req, res, next) => examController.detail(req, res, next));
router.get('/:id/questions', (req, res, next) => examController.questions(req, res, next));

// Protected routes
router.post('/custom-builder', authGuard, (req, res, next) =>
  examController.customBuilder(req, res, next)
);

export default router;
