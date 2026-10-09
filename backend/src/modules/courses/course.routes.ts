import { Router } from 'express';
import { courseController } from './course.controller';
import { authGuard, optionalAuthGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Public / Student endpoints
router.get('/featured-fasttrack', (req, res, next) =>
  courseController.getFeaturedFasttrack(req, res, next)
);

router.post('/leads/register', optionalAuthGuard, (req, res, next) =>
  courseController.registerLead(req, res, next)
);

// Admin endpoints
router.get('/leads', authGuard, roleGuard(['ADMIN']), (req, res, next) =>
  courseController.getLeads(req, res, next)
);

router.patch('/leads/:id/status', authGuard, roleGuard(['ADMIN']), (req, res, next) =>
  courseController.updateLeadStatus(req, res, next)
);

export default router;
