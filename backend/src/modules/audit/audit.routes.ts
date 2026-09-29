import { Router } from 'express';
import { auditController } from './audit.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Toàn bộ API kiểm toán yêu cầu JWT và Role ADMIN
router.use(authGuard);
router.use(roleGuard(['ADMIN']));

router.get('/', (req, res, next) => auditController.listLogs(req, res, next));
router.get('/stats', (req, res, next) => auditController.getStats(req, res, next));

export default router;
