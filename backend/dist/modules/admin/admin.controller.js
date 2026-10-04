"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./admin.dto");
const api_response_1 = require("../../utils/api-response");
class AdminController {
    async listUsers(req, res, next) {
        try {
            const filter = admin_dto_1.adminUserFilterSchema.parse(req.query);
            const result = await admin_service_1.adminService.listUsers(filter);
            (0, api_response_1.sendSuccess)(res, result.users, 'Lấy danh sách người dùng thành công', 200, {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createUser(req, res, next) {
        try {
            const validatedInput = admin_dto_1.adminCreateUserSchema.parse(req.body);
            const user = await admin_service_1.adminService.createUser(validatedInput, req);
            (0, api_response_1.sendSuccess)(res, user, 'Tạo tài khoản thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkImportUsers(req, res, next) {
        try {
            if (!req.file || !req.file.buffer) {
                throw { statusCode: 400, message: 'Vui lòng đính kèm tệp Excel (.xlsx, .csv)' };
            }
            const result = await admin_service_1.adminService.bulkImportUsers(req.file.buffer, req);
            (0, api_response_1.sendSuccess)(res, result, 'Xử lý nhập học viên hàng loạt thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updateUserStatus(req, res, next) {
        try {
            const userId = req.params.id;
            const { isActive } = admin_dto_1.adminUpdateUserStatusSchema.parse(req.body);
            const updated = await admin_service_1.adminService.updateUserStatus(userId, isActive, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật trạng thái người dùng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async grantVip(req, res, next) {
        try {
            const userId = req.params.id;
            const validatedInput = admin_dto_1.adminGrantVipSchema.parse(req.body);
            const subscription = await admin_service_1.adminService.grantVip(userId, validatedInput, req);
            (0, api_response_1.sendSuccess)(res, subscription, 'Cấp quyền VIP thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const userId = req.params.id;
            const validatedInput = admin_dto_1.adminResetPasswordSchema.parse(req.body);
            const result = await admin_service_1.adminService.resetPassword(userId, validatedInput, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async adjustQuota(req, res, next) {
        try {
            const userId = req.params.id;
            const validatedInput = admin_dto_1.adminAdjustQuotaSchema.parse(req.body);
            const result = await admin_service_1.adminService.adjustQuota(userId, validatedInput, req);
            (0, api_response_1.sendSuccess)(res, result, 'Cộng thêm lượt chấm thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserSummary(req, res, next) {
        try {
            const userId = req.params.id;
            const summary = await admin_service_1.adminService.getUserSummary(userId);
            (0, api_response_1.sendSuccess)(res, summary, 'Lấy thông tin tổng hợp học viên thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createExam(req, res, next) {
        try {
            const validatedInput = admin_dto_1.adminCreateExamSchema.parse(req.body);
            const exam = await admin_service_1.adminService.createExam(validatedInput, req);
            (0, api_response_1.sendSuccess)(res, exam, 'Tạo đề thi mới thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteExam(req, res, next) {
        try {
            const examId = req.params.id;
            const result = await admin_service_1.adminService.deleteExam(examId, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updateExam(req, res, next) {
        try {
            const examId = req.params.id;
            const updated = await admin_service_1.adminService.updateExam(examId, req.body, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật đề thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async duplicateExam(req, res, next) {
        try {
            const examId = req.params.id;
            const cloned = await admin_service_1.adminService.duplicateExam(examId, req);
            (0, api_response_1.sendSuccess)(res, cloned, 'Nhân bản đề thi thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async listTransactions(req, res, next) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const status = req.query.status;
            const result = await admin_service_1.adminService.listTransactions(page, limit, status);
            (0, api_response_1.sendSuccess)(res, result.transactions, 'Lấy danh sách giao dịch thành công', 200, {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resolveTransaction(req, res, next) {
        try {
            const txId = req.params.id;
            const validatedInput = admin_dto_1.adminResolveTransactionSchema.parse(req.body);
            const updated = await admin_service_1.adminService.resolveTransaction(txId, validatedInput, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Xử lý giao dịch thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createManualTransaction(req, res, next) {
        try {
            const validatedInput = admin_dto_1.adminCreateManualTransactionSchema.parse(req.body);
            const created = await admin_service_1.adminService.createManualTransaction(validatedInput, req);
            (0, api_response_1.sendSuccess)(res, created, 'Tạo giao dịch nạp tiền thủ công và kích hoạt VIP thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async getDashboardKPIs(req, res, next) {
        try {
            const period = req.query.period;
            const fromDate = req.query.fromDate;
            const toDate = req.query.toDate;
            const kpis = await admin_service_1.adminService.getDashboardKPIs({ period, fromDate, toDate });
            (0, api_response_1.sendSuccess)(res, kpis, 'Lấy chỉ số KPI Dashboard thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async exportDashboardReport(req, res, next) {
        try {
            const period = req.query.period;
            const fromDate = req.query.fromDate;
            const toDate = req.query.toDate;
            const format = req.query.format || 'csv';
            const csvContent = await admin_service_1.adminService.exportDashboardReport({ period, fromDate, toDate, format });
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="bao-cao-aptis-${period || 'custom'}-${Date.now()}.csv"`);
            res.send(csvContent);
        }
        catch (error) {
            next(error);
        }
    }
    async listExams(req, res, next) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 50);
            const skill = req.query.skill;
            const result = await admin_service_1.adminService.listExams(page, limit, skill);
            (0, api_response_1.sendSuccess)(res, result.exams, 'Lấy danh sách đề thi thành công', 200, {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listPlans(req, res, next) {
        try {
            const plans = await admin_service_1.adminService.listPlans();
            (0, api_response_1.sendSuccess)(res, plans, 'Lấy danh sách gói cước thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updatePlan(req, res, next) {
        try {
            const planId = req.params.id;
            const updated = await admin_service_1.adminService.updatePlan(planId, req.body, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật gói cước thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    // ── CONTENT EDITOR CONTROLLERS ─────────────────────────────────
    async getExamFull(req, res, next) {
        try {
            const examId = req.params.id;
            const exam = await admin_service_1.adminService.getExamFull(examId);
            (0, api_response_1.sendSuccess)(res, exam, 'Lấy nội dung đầy đủ đề thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updatePart(req, res, next) {
        try {
            const partId = req.params.partId;
            const updated = await admin_service_1.adminService.updatePart(partId, req.body, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật phần thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async addPart(req, res, next) {
        try {
            const examId = req.params.id;
            const part = await admin_service_1.adminService.addPart(examId, req.body, req);
            (0, api_response_1.sendSuccess)(res, part, 'Thêm phần thi mới thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async deletePart(req, res, next) {
        try {
            const partId = req.params.partId;
            const result = await admin_service_1.adminService.deletePart(partId, req);
            (0, api_response_1.sendSuccess)(res, result, 'Xóa phần thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updateQuestion(req, res, next) {
        try {
            const questionId = req.params.questionId;
            const updated = await admin_service_1.adminService.updateQuestion(questionId, req.body, req);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật câu hỏi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async addQuestion(req, res, next) {
        try {
            const partId = req.params.partId;
            const question = await admin_service_1.adminService.addQuestion(partId, req.body, req);
            (0, api_response_1.sendSuccess)(res, question, 'Thêm câu hỏi thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteQuestion(req, res, next) {
        try {
            const questionId = req.params.questionId;
            const result = await admin_service_1.adminService.deleteQuestion(questionId, req);
            (0, api_response_1.sendSuccess)(res, result, 'Xóa câu hỏi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
