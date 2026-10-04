"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const notification_dto_1 = require("./notification.dto");
const api_response_1 = require("../../utils/api-response");
class NotificationController {
    async getMyNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const filter = notification_dto_1.notificationFilterSchema.parse(req.query);
            const result = await notification_service_1.notificationService.getMyNotifications(userId, filter);
            (0, api_response_1.sendSuccess)(res, result.items, 'Lấy danh sách thông báo thành công', 200, {
                unreadCount: result.unreadCount,
                ...result.meta,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await notification_service_1.notificationService.getUnreadCount(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy số lượng thông báo chưa đọc thành công');
        }
        catch (err) {
            next(err);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const result = await notification_service_1.notificationService.markAsRead(userId, id);
            (0, api_response_1.sendSuccess)(res, result, 'Đã đánh dấu thông báo là đã đọc');
        }
        catch (err) {
            next(err);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await notification_service_1.notificationService.markAllAsRead(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Đã đánh dấu tất cả thông báo là đã đọc');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
