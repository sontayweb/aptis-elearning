"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = exports.notificationFilterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.notificationFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    isRead: zod_1.z.preprocess((val) => {
        if (val === 'true')
            return true;
        if (val === 'false')
            return false;
        return undefined;
    }, zod_1.z.boolean().optional()),
});
exports.createNotificationSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1, 'Tiêu đề thông báo không được để trống'),
    message: zod_1.z.string().min(1, 'Nội dung thông báo không được để trống'),
    type: zod_1.z.nativeEnum(client_1.NotificationType).default(client_1.NotificationType.SYSTEM),
    link: zod_1.z.string().optional().nullable(),
});
