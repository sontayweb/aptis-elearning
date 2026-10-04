"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const role_guard_1 = require("../../middlewares/role.guard");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
const router = (0, express_1.Router)();
// Toàn bộ Admin API yêu cầu JWT và Role ADMIN
router.use(auth_guard_1.authGuard);
router.use((0, role_guard_1.roleGuard)(['ADMIN']));
// Quản lý người dùng & Tác vụ Hỗ trợ Học viên
router.get('/users', (req, res, next) => admin_controller_1.adminController.listUsers(req, res, next));
router.post('/users', (req, res, next) => admin_controller_1.adminController.createUser(req, res, next));
router.post('/users/bulk-import', upload.single('file'), (req, res, next) => admin_controller_1.adminController.bulkImportUsers(req, res, next));
router.get('/users/:id/summary', (req, res, next) => admin_controller_1.adminController.getUserSummary(req, res, next));
router.patch('/users/:id/status', (req, res, next) => admin_controller_1.adminController.updateUserStatus(req, res, next));
router.post('/users/:id/grant-vip', (req, res, next) => admin_controller_1.adminController.grantVip(req, res, next));
router.post('/users/:id/reset-password', (req, res, next) => admin_controller_1.adminController.resetPassword(req, res, next));
router.post('/users/:id/adjust-quota', (req, res, next) => admin_controller_1.adminController.adjustQuota(req, res, next));
// Quản lý đề thi
router.get('/exams', (req, res, next) => admin_controller_1.adminController.listExams(req, res, next));
router.post('/exams', (req, res, next) => admin_controller_1.adminController.createExam(req, res, next));
router.get('/exams/:id/full', (req, res, next) => admin_controller_1.adminController.getExamFull(req, res, next));
router.patch('/exams/:id', (req, res, next) => admin_controller_1.adminController.updateExam(req, res, next));
router.post('/exams/:id/duplicate', (req, res, next) => admin_controller_1.adminController.duplicateExam(req, res, next));
router.delete('/exams/:id', (req, res, next) => admin_controller_1.adminController.deleteExam(req, res, next));
// Content Editor — Parts
router.post('/exams/:id/parts', (req, res, next) => admin_controller_1.adminController.addPart(req, res, next));
router.patch('/parts/:partId', (req, res, next) => admin_controller_1.adminController.updatePart(req, res, next));
router.delete('/parts/:partId', (req, res, next) => admin_controller_1.adminController.deletePart(req, res, next));
// Content Editor — Questions
router.post('/parts/:partId/questions', (req, res, next) => admin_controller_1.adminController.addQuestion(req, res, next));
router.patch('/questions/:questionId', (req, res, next) => admin_controller_1.adminController.updateQuestion(req, res, next));
router.delete('/questions/:questionId', (req, res, next) => admin_controller_1.adminController.deleteQuestion(req, res, next));
// Quản lý giao dịch SePay
router.get('/transactions', (req, res, next) => admin_controller_1.adminController.listTransactions(req, res, next));
router.post('/transactions/manual', (req, res, next) => admin_controller_1.adminController.createManualTransaction(req, res, next));
router.post('/transactions/:id/resolve', (req, res, next) => admin_controller_1.adminController.resolveTransaction(req, res, next));
// Quản lý gói cước (Plans)
router.get('/plans', (req, res, next) => admin_controller_1.adminController.listPlans(req, res, next));
router.patch('/plans/:id', (req, res, next) => admin_controller_1.adminController.updatePlan(req, res, next));
// Thống kê Dashboard KPIs & Xuất báo cáo
router.get('/dashboard/stats', (req, res, next) => admin_controller_1.adminController.getDashboardKPIs(req, res, next));
router.get('/dashboard/export', (req, res, next) => admin_controller_1.adminController.exportDashboardReport(req, res, next));
exports.default = router;
