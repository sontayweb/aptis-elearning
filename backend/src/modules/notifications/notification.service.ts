import { prisma } from '../../config/database';
import { NotificationFilterInput, CreateNotificationInput } from './notification.dto';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  /**
   * Lấy danh sách thông báo của người dùng kèm phân trang và đếm số lượng chưa đọc
   */
  async getMyNotifications(userId: string, filter: NotificationFilterInput) {
    const { page, limit, isRead } = filter;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (typeof isRead === 'boolean') {
      where.is_read = isRead;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
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
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
    return { unreadCount: count };
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(userId: string, notificationId: string) {
    const noti = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!noti || noti.user_id !== userId) {
      throw { statusCode: 404, message: 'Thông báo không tồn tại hoặc bạn không có quyền' };
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Tạo thông báo mới cho người dùng
   */
  async createNotification(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        link: data.link,
      },
    });
  }
}

export const notificationService = new NotificationService();
