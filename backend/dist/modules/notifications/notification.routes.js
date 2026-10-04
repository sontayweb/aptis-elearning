"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Tất cả endpoints notifications yêu cầu đăng nhập
router.use(auth_guard_1.authGuard);
router.get('/', (req, res, next) => notification_controller_1.notificationController.getMyNotifications(req, res, next));
router.get('/unread-count', (req, res, next) => notification_controller_1.notificationController.getUnreadCount(req, res, next));
router.patch('/read-all', (req, res, next) => notification_controller_1.notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notification_controller_1.notificationController.markAsRead(req, res, next));
exports.default = router;
