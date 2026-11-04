import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';
import { marathonService } from './marathon.service';
import { sendSuccess, sendError } from '../../utils/api-response';
import {
  MarathonQuerySchema,
  MarathonBatchQuerySchema,
  MarathonAutosaveSchema,
  MarathonCompleteExamSchema,
  MarathonResetSchema,
} from './marathon.dto';
import { ExamSkill } from '@prisma/client';

export class MarathonController {
  async getCatalog(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = MarathonQuerySchema.parse(req.query);
      const data = await marathonService.getCatalog(parsed.skill, parsed.part);
      sendSuccess(res, data, 'Lấy danh mục Marathon thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh mục Marathon', err.statusCode || 400);
    }
  }

  async getBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = MarathonBatchQuerySchema.parse(req.query);
      const data = await marathonService.getBatch(parsed.skill, parsed.part, parsed.indices);
      sendSuccess(res, data, 'Lấy nội dung chi tiết đề Marathon thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi tải nội dung đề Marathon', err.statusCode || 400);
    }
  }

  async getProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = MarathonQuerySchema.parse(req.query);
      if (!req.user?.userId) {
        // Guest user -> Không có record DB, trả về hasProgress: false để frontend tự dùng LocalStorage
        return sendSuccess(res, { hasProgress: false, progress: null });
      }

      const data = await marathonService.getProgress(req.user.userId, parsed.skill, parsed.part);
      sendSuccess(res, data, 'Lấy tiến trình dở dang thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy tiến trình', err.statusCode || 400);
    }
  }

  async autosave(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.userId) {
        return sendSuccess(res, { isGuest: true, saved: false });
      }

      const parsed = MarathonAutosaveSchema.parse(req.body);
      const data = await marathonService.autosaveProgress(
        req.user.userId,
        parsed.skill,
        parsed.partNumber,
        {
          currentExamIndex: parsed.currentExamIndex,
          currentExamId: parsed.currentExamId,
          currentDraftAnswers: parsed.currentDraftAnswers,
          currentDraftOrders: parsed.currentDraftOrders,
          additionalTimeSeconds: parsed.additionalTimeSeconds,
        }
      );
      sendSuccess(res, data, 'Đã tự động lưu tiến trình');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi tự động lưu', err.statusCode || 400);
    }
  }

  async completeExam(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = MarathonCompleteExamSchema.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        // Guest: chấm điểm offline trực tiếp dựa trên logic grading
        return sendError(res, 'Vui lòng đăng nhập để lưu kết quả và tiến độ lên hệ thống', 401);
      }

      const data = await marathonService.completeExam(
        userId,
        parsed.skill,
        parsed.partNumber,
        {
          examId: parsed.examId,
          examIndex: parsed.examIndex,
          answers: parsed.answers,
          orders: parsed.orders,
          timeSpentSeconds: parsed.timeSpentSeconds,
        }
      );
      sendSuccess(res, data, 'Chấm điểm và cập nhật tiến độ thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi chấm điểm đề', err.statusCode || 400);
    }
  }

  async reset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.userId) {
        return sendSuccess(res, { success: true });
      }

      const parsed = MarathonResetSchema.parse(req.body);
      const data = await marathonService.resetProgress(
        req.user.userId,
        parsed.skill,
        parsed.partNumber,
        parsed.scope,
        parsed.examId
      );
      sendSuccess(res, data, 'Đã đặt lại tiến trình');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi reset tiến trình', err.statusCode || 400);
    }
  }
}

export const marathonController = new MarathonController();

