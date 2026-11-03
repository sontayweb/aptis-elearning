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
      let userId = (req as any)?.user?.userId || (req as any)?.user?.id || systemActor?.id || null;
      let actorName = (req as any)?.user?.full_name || (req as any)?.user?.name || systemActor?.name || null;
      let actorEmail = (req as any)?.user?.email || systemActor?.email || null;
      let actorRole = (req as any)?.user?.role || systemActor?.role || null;

      // Nếu có userId mà chưa có thông tin email/name (ví dụ từ worker nộp bài ngầm), tự động tra cứu DB
      if (userId && (!actorEmail || !actorName || actorName === 'Học viên')) {
        try {
          const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { full_name: true, email: true, role: true },
          });
          if (userRecord) {
            actorName = userRecord.full_name || actorName || 'Học viên';
            actorEmail = userRecord.email || actorEmail;
            actorRole = userRecord.role || actorRole;
          }
        } catch {
          // im lặng bỏ qua nếu lỗi tra cứu tạm thời
        }
      }

      // Phân định rõ ràng tránh nhầm lẫn:
      // - Chưa đăng nhập (Khách vãng lai / Khách thi thử): Ghi nhận là "Khách vãng lai" (guest@aptiskytich.vn, role GUEST)
      // - Tác vụ nội bộ máy chủ (Cron, AI grading, DB Sync): Ghi nhận là "Hệ thống tự động" (system@aptiskytich.vn, role SYSTEM)
      if (!actorEmail) {
        if (!userId && (req || systemActor?.role === 'GUEST' || systemActor?.name?.toLowerCase().includes('khách'))) {
          actorName = actorName || 'Khách vãng lai';
          actorEmail = 'guest@aptiskytich.vn';
          actorRole = actorRole || 'GUEST';
        } else if (!userId) {
          actorName = actorName || 'Hệ thống tự động';
          actorEmail = 'system@aptiskytich.vn';
          actorRole = actorRole || 'SYSTEM';
        } else {
          actorName = actorName || 'Người dùng';
          actorEmail = 'guest@aptiskytich.vn';
          actorRole = actorRole || 'STUDENT';
        }
      }

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
    const { action, entityType, userId, search, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) {
      if (action.includes(',')) {
        where.action = { in: action.split(',').map((a) => a.trim() as AuditAction) };
      } else {
        where.action = action as AuditAction;
      }
    }
    if (entityType) where.entity_type = entityType;
    if (userId) where.user_id = userId;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { actor_name: { contains: q, mode: 'insensitive' } },
        { actor_email: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

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
