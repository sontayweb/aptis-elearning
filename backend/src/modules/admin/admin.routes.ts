import { Router } from 'express';
import { adminController } from './admin.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Toàn bộ Admin API yêu cầu JWT và Role ADMIN
router.use(authGuard);
router.use(roleGuard(['ADMIN']));

// Quản lý người dùng & Tác vụ Hỗ trợ Học viên
router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
router.post('/users', (req, res, next) => adminController.createUser(req, res, next));
router.post('/users/bulk-import', upload.single('file'), (req, res, next) =>
  adminController.bulkImportUsers(req, res, next)
);
router.get('/users/:id/summary', (req, res, next) =>
  adminController.getUserSummary(req, res, next)
);
router.patch('/users/:id/status', (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);
router.post('/users/:id/grant-vip', (req, res, next) =>
  adminController.grantVip(req, res, next)
);
router.post('/users/:id/reset-password', (req, res, next) =>
  adminController.resetPassword(req, res, next)
);
router.post('/users/:id/adjust-quota', (req, res, next) =>
  adminController.adjustQuota(req, res, next)
);

// Quản lý đề thi
router.get('/exams', (req, res, next) => adminController.listExams(req, res, next));
router.post('/exams', (req, res, next) => adminController.createExam(req, res, next));
router.get('/exams/:id/full', (req, res, next) => adminController.getExamFull(req, res, next));
router.patch('/exams/:id', (req, res, next) => adminController.updateExam(req, res, next));
router.post('/exams/:id/duplicate', (req, res, next) => adminController.duplicateExam(req, res, next));
router.delete('/exams/:id', (req, res, next) => adminController.deleteExam(req, res, next));

// Content Editor — Parts
router.post('/exams/:id/parts', (req, res, next) => adminController.addPart(req, res, next));
router.patch('/parts/:partId', (req, res, next) => adminController.updatePart(req, res, next));
router.delete('/parts/:partId', (req, res, next) => adminController.deletePart(req, res, next));

// Content Editor — Questions
router.post('/parts/:partId/questions', (req, res, next) => adminController.addQuestion(req, res, next));
router.patch('/questions/:questionId', (req, res, next) => adminController.updateQuestion(req, res, next));
router.delete('/questions/:questionId', (req, res, next) => adminController.deleteQuestion(req, res, next));


// Quản lý giao dịch SePay
router.get('/transactions', (req, res, next) =>
  adminController.listTransactions(req, res, next)
);
router.post('/transactions/manual', (req, res, next) =>
  adminController.createManualTransaction(req, res, next)
);
router.post('/transactions/:id/resolve', (req, res, next) =>
  adminController.resolveTransaction(req, res, next)
);

// Quản lý gói cước (Plans)
router.get('/plans', (req, res, next) => adminController.listPlans(req, res, next));
router.patch('/plans/:id', (req, res, next) => adminController.updatePlan(req, res, next));

// Thống kê Dashboard KPIs
router.get('/dashboard/stats', (req, res, next) =>
  adminController.getDashboardKPIs(req, res, next)
);

export default router;
