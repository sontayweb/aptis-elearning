"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
class NotificationService {
    /**
     * Lấy danh sách thông báo của người dùng kèm phân trang và đếm số lượng chưa đọc
     */
    async getMyNotifications(userId, filter) {
        const { page, limit, isRead } = filter;
        const skip = (page - 1) * limit;
        const where = { user_id: userId };
        if (typeof isRead === 'boolean') {
            where.is_read = isRead;
        }
        const [items, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.count({
                where: { user_id: userId, is_read: false },
            }),
        ]);
        return {
            items,
            unreadCount,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Lấy số lượng thông báo chưa đọc
     */
    async getUnreadCount(userId) {
        const count = await database_1.prisma.notification.count({
            where: { user_id: userId, is_read: false },
        });
        return { unreadCount: count };
    }
    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    async markAsRead(userId, notificationId) {
        const noti = await database_1.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!noti || noti.user_id !== userId) {
            throw { statusCode: 404, message: 'Thông báo không tồn tại hoặc bạn không có quyền' };
        }
        return database_1.prisma.notification.update({
            where: { id: notificationId },
            data: { is_read: true },
        });
    }
    /**
     * Đánh dấu tất cả thông báo của người dùng là đã đọc
     */
    async markAllAsRead(userId) {
        const result = await database_1.prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true },
        });
        return { updatedCount: result.count };
    }
    /**
     * Tạo thông báo mới cho người dùng
     */
    async createNotification(data) {
        return database_1.prisma.notification.create({
            data: {
                user_id: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || client_1.NotificationType.SYSTEM,
                link: data.link,
            },
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
