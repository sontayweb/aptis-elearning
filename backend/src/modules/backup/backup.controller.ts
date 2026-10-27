import { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { backupService } from './backup.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

const auditService = new AuditService();

export class BackupController {
  /**
   * Lấy thống kê số lượng bản ghi của CSDL
   */
  async getDatabaseStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await backupService.getDatabaseStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liệt kê danh sách các bản sao lưu
   */
  async listBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const backups = await backupService.listBackups();
      res.status(200).json({
        success: true,
        data: backups,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo bản sao lưu mới (full | sql | json)
   */
  async createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type = 'full', retentionCount = 10 } = req.body;

      let result;
      if (type === 'sql') {
        result = await backupService.createSqlBackup(Number(retentionCount));
      } else if (type === 'json') {
        result = await backupService.createJsonSnapshot(Number(retentionCount));
      } else {
        result = await backupService.createFullBackup({ type: 'full', retentionCount: Number(retentionCount) });
      }

      // Ghi log kiểm toán
      await auditService.record({
        req,
        action: AuditAction.SYSTEM_SETTING_UPDATE,
        entityType: 'DATABASE_BACKUP',
        entityId: result.backup?.filename || 'backup',
        description: `Quản trị viên đã tạo bản sao lưu CSDL (Loại: ${type.toUpperCase()}) - ${result.message}`,
        newValue: result.backup,
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khôi phục cơ sở dữ liệu từ file .sql
   */
  async restoreBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Tên tệp sao lưu (filename) không hợp lệ',
        });
        return;
      }

      const result = await backupService.restoreSqlBackup(filename);

      // Ghi log kiểm toán thao tác nhạy cảm
      await auditService.record({
        req,
        action: AuditAction.SYSTEM_SETTING_UPDATE,
        entityType: 'DATABASE_RESTORE',
        entityId: filename,
        description: `Quản trị viên đã khôi phục CSDL từ tệp sao lưu ${filename}`,
        newValue: { filename, durationMs: result.durationMs },
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tải tệp sao lưu (.sql) về máy quản trị viên
   */
  async downloadBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = backupService.getDownloadPath(filename);

      if (!filePath) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tệp sao lưu trên hệ thống',
        });
        return;
      }

      const safeBasename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${safeBasename}"`);
      res.setHeader('Content-Type', 'application/sql');
      res.download(filePath, safeBasename);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa một bản sao lưu
   */
  async deleteBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;
      const success = await backupService.deleteBackup(filename);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tệp sao lưu để xóa',
        });
        return;
      }

      // Ghi log kiểm toán
      await auditService.record({
        req,
        action: AuditAction.SYSTEM_SETTING_UPDATE,
        entityType: 'DATABASE_BACKUP',
        entityId: filename,
        description: `Quản trị viên đã xóa bản sao lưu: ${filename}`,
      });

      res.status(200).json({
        success: true,
        message: `Đã xóa bản sao lưu: ${filename}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const backupController = new BackupController();
