import { Response, NextFunction } from 'express';
import { submissionService } from './submission.service';
import {
  startSubmissionSchema,
  autosaveAnswerSchema,
  heartbeatSchema,
  myHistoryFilterSchema,
} from './submission.dto';
import { sendSuccess, sendError } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';
import { audioService } from '../audio/audio.service';

export class SubmissionController {
  async myHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filter = myHistoryFilterSchema.parse(req.query);
      const result = await submissionService.getMyHistory(userId, filter);
      sendSuccess(res, result.items, 'Lấy lịch sử làm bài thành công', 200, {
        summary: result.summary,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async start(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { examId } = startSubmissionSchema.parse(req.body);
      const result = await submissionService.startSubmission(userId, examId);
      sendSuccess(res, result, 'Bắt đầu bài thi thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async autosave(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.id;
      const validatedInput = autosaveAnswerSchema.parse(req.body);
      const result = await submissionService.autosave(userId, submissionId, validatedInput);
      sendSuccess(res, result, 'Lưu nháp câu trả lời thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async heartbeat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.id;
      const validatedInput = heartbeatSchema.parse(req.body);
      const result = await submissionService.heartbeat(userId, submissionId, validatedInput);
      sendSuccess(res, result, 'Heartbeat OK', 200);
    } catch (error) {
      next(error);
    }
  }

  async resume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.id;
      const result = await submissionService.resume(userId, submissionId);
      sendSuccess(res, result, 'Khôi phục phiên làm bài thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.id;
      const result = await submissionService.submit(userId, submissionId);
      sendSuccess(res, result, 'Nộp bài thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async detail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user?.role;
      const submissionId = req.params.id;
      const result = await submissionService.getSubmissionDetail(userId, submissionId, role);
      sendSuccess(res, result, 'Lấy kết quả bài thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async uploadAudio(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.id;
      const questionId = req.params.questionId;
      const file = req.file;

      if (!file) {
        sendError(res, 'Vui lòng đính kèm tệp âm thanh ghi âm', 400);
        return;
      }

      const durationSeconds = req.body.durationSeconds
        ? parseInt(req.body.durationSeconds, 10)
        : undefined;

      const result = await audioService.saveSubmissionAudio(
        userId,
        submissionId,
        questionId,
        file,
        durationSeconds
      );

      sendSuccess(res, result, 'Lưu file âm thanh thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async streamAudio(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user?.role;
      const submissionId = req.params.id;
      const questionId = req.params.questionId;

      await audioService.streamSubmissionAudio(
        submissionId,
        questionId,
        req.headers,
        res,
        userId,
        role
      );
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
