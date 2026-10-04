"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../../config/database");
class AuditService {
    /**
     * Ghi log kiểm toán bất đồng bộ (Non-blocking), không làm gián đoạn request của user
     */
    async record(params) {
        try {
            const { req, action, entityType, entityId, description, oldValue, newValue, systemActor, } = params;
            // 1. Xác định Người thực hiện (Actor)
            const userId = req?.user?.userId || req?.user?.id || systemActor?.id || null;
            const actorName = req?.user?.full_name || req?.user?.name || systemActor?.name || 'Hệ thống';
            const actorEmail = req?.user?.email || systemActor?.email || 'system@aptiskytich.vn';
            const actorRole = req?.user?.role || systemActor?.role || 'SYSTEM';
            // 2. Bóc tách IP và User Agent từ Request
            let ipAddress = null;
            let userAgent = null;
            if (req) {
                const forwarded = req.headers['x-forwarded-for'];
                if (typeof forwarded === 'string') {
                    ipAddress = forwarded.split(',')[0].trim();
                }
                else if (Array.isArray(forwarded)) {
                    ipAddress = forwarded[0];
                }
                else {
                    ipAddress = req.socket?.remoteAddress || null;
                }
                userAgent = req.headers['user-agent'] || null;
            }
            // 3. Insert append-only vào DB
            await database_1.prisma.auditLog.create({
                data: {
                    user_id: userId,
                    actor_name: actorName,
                    actor_email: actorEmail,
                    actor_role: actorRole,
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    description,
                    old_value: oldValue !== undefined ? JSON.parse(JSON.stringify(oldValue)) : undefined,
                    new_value: newValue !== undefined ? JSON.parse(JSON.stringify(newValue)) : undefined,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                },
            });
        }
        catch (err) {
            console.error('[AUDIT_LOG_ERROR] Lỗi ghi nhật ký kiểm toán:', err);
        }
    }
    /**
     * Truy vấn danh sách Audit Logs cho giao diện Quản trị viên
     */
    async listLogs(filter) {
        const { action, entityType, userId, page, limit } = filter;
        const skip = (page - 1) * limit;
        const where = {};
        if (action)
            where.action = action;
        if (entityType)
            where.entity_type = entityType;
        if (userId)
            where.user_id = userId;
        const [logs, total] = await Promise.all([
            database_1.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            database_1.prisma.auditLog.count({ where }),
        ]);
        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Thống kê sơ bộ về số lượng log
     */
    async getAuditStats() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const [totalLogs, todayLogs, actionCounts] = await Promise.all([
            database_1.prisma.auditLog.count(),
            database_1.prisma.auditLog.count({
                where: { created_at: { gte: startOfToday } },
            }),
            database_1.prisma.auditLog.groupBy({
                by: ['action'],
                _count: { action: true },
            }),
        ]);
        return {
            totalLogs,
            todayLogs,
            actionCounts,
        };
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
