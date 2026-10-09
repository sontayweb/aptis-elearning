import { Router } from 'express';
import { cmsController } from './cms.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Public routes
router.get('/pages/:slug', (req, res, next) => cmsController.getPage(req, res, next));
router.get('/reviews', (req, res, next) => cmsController.getReviews(req, res, next));
router.get('/featured-feedbacks', (req, res, next) => cmsController.getFeaturedFeedbacks(req, res, next));
router.get('/hall-of-fame', (req, res, next) => cmsController.getHallOfFame(req, res, next));

// Student route: Nộp review đề thi thật
router.post('/reviews', authGuard, (req, res, next) =>
  cmsController.createReview(req, res, next)
);

// Admin routes: Quản trị & Duyệt review, kích hoạt thưởng
router.patch('/reviews/:id', authGuard, roleGuard(['ADMIN']), (req, res, next) =>
  cmsController.updateReview(req, res, next)
);
router.patch('/reviews/:id/approve', authGuard, roleGuard(['ADMIN']), (req, res, next) =>
  cmsController.approveReview(req, res, next)
);
router.delete('/reviews/:id', authGuard, roleGuard(['ADMIN']), (req, res, next) =>
  cmsController.deleteReview(req, res, next)
);

export default router;
