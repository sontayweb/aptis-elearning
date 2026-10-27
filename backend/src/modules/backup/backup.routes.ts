import { Router } from 'express';
import { backupController } from './backup.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Toàn bộ Endpoint Backup yêu cầu quyền SUPER_ADMIN hoặc ADMIN
router.use(authGuard);
router.use(roleGuard(['ADMIN', 'SUPER_ADMIN']));

// Thống kê số lượng bản ghi CSDL hiện tại
router.get('/stats', (req, res, next) => backupController.getDatabaseStats(req, res, next));

// Danh sách các bản sao lưu
router.get('/', (req, res, next) => backupController.listBackups(req, res, next));

// Tạo bản sao lưu mới (body: { type: 'full' | 'sql' | 'json', retentionCount?: number })
router.post('/', (req, res, next) => backupController.createBackup(req, res, next));

// Khôi phục CSDL từ file backup .sql (body: { filename: string })
router.post('/restore', (req, res, next) => backupController.restoreBackup(req, res, next));

// Tải file backup .sql về máy
router.get('/:filename/download', (req, res, next) => backupController.downloadBackup(req, res, next));

// Xóa bản sao lưu
router.delete('/:filename', (req, res, next) => backupController.deleteBackup(req, res, next));

export default router;
