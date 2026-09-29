import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const notificationFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  isRead: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, 'Tiêu đề thông báo không được để trống'),
  message: z.string().min(1, 'Nội dung thông báo không được để trống'),
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  link: z.string().optional().nullable(),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
