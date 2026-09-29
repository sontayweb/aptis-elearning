import { Request, Response, NextFunction } from 'express';
import { dictationService } from './dictation.service';
import { DictationLevel, DictationMode } from '@prisma/client';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';
import { z } from 'zod';

const checkSentenceSchema = z.object({
  mode: z.nativeEnum(DictationMode).default(DictationMode.DICTATION),
  submittedText: z.string().optional().default(''),
  audioUrl: z.string().optional(),
});

export class DictationController {
  async getLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await dictationService.getLevelsSummary(userId);
      sendSuccess(res, result, 'Lấy tổng quan Level nghe chép thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const level = (req.query.level as DictationLevel) || DictationLevel.FOUNDATION;
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await dictationService.getLessons(level, userId);
      sendSuccess(res, result, 'Lấy danh sách bài học thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getLessonDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = req.params.id;
      const result = await dictationService.getLessonDetail(lessonId);
      sendSuccess(res, result, 'Lấy chi tiết bài học thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async checkSentence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sentenceId = req.params.id;
      const { mode, submittedText, audioUrl } = checkSentenceSchema.parse(req.body);
      const result = await dictationService.checkSentence(
        userId,
        sentenceId,
        mode,
        submittedText,
        audioUrl
      );
      sendSuccess(res, result, 'Kiểm tra câu thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const dictationController = new DictationController();
