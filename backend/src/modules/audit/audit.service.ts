import { prisma } from '../../config/database';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';
import { AuditLogFilterInput } from './audit.dto';

export interface LogParams {
  req?: Request;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  systemActor?: {
    id?: string;
    name: string;
    email: string;
    role: string;
  };
}

export class AuditService {
  /**
   * Ghi log kiểm toán bất đồng bộ (Non-blocking), không làm gián đoạn request của user
   */
  async record(params: LogParams): Promise<void> {
    try {
      const {
        req,
        action,
        entityType,
        entityId,
        description,
        oldValue,
        newValue,
        systemActor,
      } = params;

      // 1. Xác định Người thực hiện (Actor)
      const userId = (req as any)?.user?.userId || (req as any)?.user?.id || systemActor?.id || null;
      const actorName = (req as any)?.user?.full_name || (req as any)?.user?.name || systemActor?.name || 'Hệ thống';
      const actorEmail = (req as any)?.user?.email || systemActor?.email || 'system@aptiskytich.vn';
      const actorRole = (req as any)?.user?.role || systemActor?.role || 'SYSTEM';

      // 2. Bóc tách IP và User Agent từ Request
      let ipAddress: string | null = null;
      let userAgent: string | null = null;

      if (req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
          ipAddress = forwarded.split(',')[0].trim();
        } else if (Array.isArray(forwarded)) {
          ipAddress = forwarded[0];
        } else {
          ipAddress = req.socket?.remoteAddress || null;
        }
        userAgent = (req.headers['user-agent'] as string) || null;
      }

      // 3. Insert append-only vào DB
      await prisma.auditLog.create({
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
    } catch (err) {
      console.error('[AUDIT_LOG_ERROR] Lỗi ghi nhật ký kiểm toán:', err);
    }
  }

  /**
   * Truy vấn danh sách Audit Logs cho giao diện Quản trị viên
   */
  async listLogs(filter: AuditLogFilterInput) {
    const { action, entityType, userId, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (userId) where.user_id = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where }),
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
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { created_at: { gte: startOfToday } },
      }),
      prisma.auditLog.groupBy({
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

export const auditService = new AuditService();
