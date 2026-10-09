import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Public endpoint (Client / Học viên lấy cấu hình công khai)
router.get('/public', (req, res, next) =>
  settingsController.getPublicSettings(req, res, next)
);

// Admin endpoints (Quản trị viên xem và cập nhật cấu hình)
router.get('/', authGuard, roleGuard(['ADMIN', 'SUPER_ADMIN']), (req, res, next) =>
  settingsController.getAllSettings(req, res, next)
);

router.put('/', authGuard, roleGuard(['ADMIN', 'SUPER_ADMIN']), (req, res, next) =>
  settingsController.updateSettings(req, res, next)
);

export default router;
