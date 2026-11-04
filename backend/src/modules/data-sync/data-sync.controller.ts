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
        message: `Tự động kiểm tra và tối ưu ngân hàng đề hoàn tất: ${result.totalFixed} mục đã được xử lý thành công (${result.durationMs}ms)!`,
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
        message: `Hoàn tất kiểm tra phòng thi: ${result.totalPartsTested} phần thi — Tỷ lệ đạt chuẩn: ${result.overallPassRate}%`,
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

  /**
   * POST /api/admin/data-sync/resolve-exam
   * Xử lý quyết định của Admin từ Modal Visual Diff: Ghi đè, Tạo biến thể, hoặc Bỏ qua
   */
  async resolveExamAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, incomingExam, existingExamId, variantTag } = req.body || {};
      if (!action || !incomingExam) {
        res.status(400).json({ success: false, message: 'Thiếu tham số action hoặc incomingExam.' });
        return;
      }

      const result = await dataSyncService.resolveExamAction({
        action,
        incomingExam,
        existingExamId,
        variantTag,
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
        message: dryRun ? `[Kiểm tra thử] Đã thẩm định ${result.totalProcessed} đề: ${result.validDryRunCount} đề hợp lệ sẵn sàng nạp, ${result.validationFailedCount} đề bị lỗi cấu trúc.` : `Đã nạp thành công ${result.totalProcessed} đề vào kho (Tạo mới: ${result.createdCount}, Cập nhật: ${result.deepUpdatedCount}, Bảo toàn an toàn bài làm học viên: ${result.inPlaceUpdatedCount}).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dataSyncController = new DataSyncController();

