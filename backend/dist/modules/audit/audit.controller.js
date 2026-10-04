"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("./audit.service");
const audit_dto_1 = require("./audit.dto");
const api_response_1 = require("../../utils/api-response");
class AuditController {
    async listLogs(req, res, next) {
        try {
            const filter = audit_dto_1.auditLogFilterSchema.parse(req.query);
            const result = await audit_service_1.auditService.listLogs(filter);
            (0, api_response_1.sendSuccess)(res, result.logs, 'Lấy danh sách nhật ký kiểm toán thành công', 200, {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const stats = await audit_service_1.auditService.getAuditStats();
            (0, api_response_1.sendSuccess)(res, stats, 'Lấy thống kê nhật ký kiểm toán thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();
