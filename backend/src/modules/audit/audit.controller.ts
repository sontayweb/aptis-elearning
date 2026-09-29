import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { auditLogFilterSchema } from './audit.dto';
import { sendSuccess } from '../../utils/api-response';

export class AuditController {
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = auditLogFilterSchema.parse(req.query);
      const result = await auditService.listLogs(filter);
      sendSuccess(res, result.logs, 'Lấy danh sách nhật ký kiểm toán thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await auditService.getAuditStats();
      sendSuccess(res, stats, 'Lấy thống kê nhật ký kiểm toán thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
