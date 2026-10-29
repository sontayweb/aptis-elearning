import { Request, Response, NextFunction } from 'express';
import { dataSyncService } from './data-sync.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

const auditService = new AuditService();

export class DataSyncController {
  /**
   * GET /api/admin/data-sync/overview
   * Lấy thống kê tổng quan kho đề, phân bổ QuestionType, nguồn đồng bộ và chẩn đoán sức khỏe dữ liệu
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dataSyncService.getOverview();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/data-sync/standardize
   * Chạy tiến trình tự động chuẩn hóa & sửa lỗi (Auto-Heal) trực tiếp trên Database
   */
  async runAutoStandardize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dataSyncService.runAutoStandardize();

      await auditService.record({
        req,
        action: AuditAction.SYSTEM_SETTING_UPDATE,
        entityType: 'DATA_SYNC_STANDARDIZE',
        entityId: 'auto-standardize',
        description: `Quản trị viên chạy chuẩn hóa kho đề tự động: Đã xử lý ${result.totalFixed} mục (Chuẩn hóa tên: ${result.normalizedTitlesCount}, Khử trùng: ${result.deduplicatedExamsCount}, Xóa rỗng: ${result.removedEmptyExamsCount}, Sửa QuestionType: ${result.fixedQuestionTypesCount})`,
        newValue: result,
      });

      res.status(200).json({
        success: true,
        message: `Đã chuẩn hóa dữ liệu thành công (${result.totalFixed} mục được tối ưu trong ${result.durationMs}ms).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/data-sync/audit
   * Chạy bộ Unit Test đối soát tự động từng Part của Nghe, Nói, Đọc, Viết, Thi thử
   */
  async runUnitTestAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sampleLimit = Number(req.body?.sampleLimit) || 35;
      const result = await dataSyncService.runUnitTestAudit(sampleLimit);

      res.status(200).json({
        success: true,
        message: `Hoàn tất kiểm thử ${result.totalPartsTested} phần thi — Tỷ lệ đạt: ${result.overallPassRate}%`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/data-sync/sync-batch
   * Đồng bộ hàng loạt đề thi qua Data Contract & Deep Upsert Engine
   */
  async syncBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { snapshotId, exams, defaultSource, dryRun = false, limit } = req.body || {};

      const result = await dataSyncService.syncBatch({
        snapshotId,
        exams,
        defaultSource,
        dryRun: Boolean(dryRun),
        limit: limit ? Number(limit) : undefined,
      });

      if (!dryRun) {
        await auditService.record({
          req,
          action: AuditAction.SYSTEM_SETTING_UPDATE,
          entityType: 'DATA_SYNC_UPSERT',
          entityId: snapshotId || defaultSource || 'custom-json',
          description: `Đồng bộ Deep Upsert từ nguồn ${result.source}: Xử lý ${result.totalProcessed} đề (Tạo mới: ${result.createdCount}, Deep Update: ${result.deepUpdatedCount}, Safe In-Place: ${result.inPlaceUpdatedCount}, Bị chặn: ${result.validationFailedCount})`,
          newValue: {
            source: result.source,
            totalProcessed: result.totalProcessed,
            createdCount: result.createdCount,
            deepUpdatedCount: result.deepUpdatedCount,
            inPlaceUpdatedCount: result.inPlaceUpdatedCount,
            validationFailedCount: result.validationFailedCount,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: dryRun
          ? `[Dry-Run] Đã thẩm định ${result.totalProcessed} đề thi: ${result.validDryRunCount} hợp lệ, ${result.validationFailedCount} bị chặn.`
          : `Đồng bộ hoàn tất ${result.totalProcessed} đề thi (Tạo mới: ${result.createdCount}, Cập nhật sâu: ${result.deepUpdatedCount}, Bảo toàn bài nộp: ${result.inPlaceUpdatedCount}).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dataSyncController = new DataSyncController();

