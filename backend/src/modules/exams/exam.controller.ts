import { Request, Response, NextFunction } from 'express';
import { examService } from './exam.service';
import { examFilterSchema, customExamBuilderSchema } from './exam.dto';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class ExamController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = examFilterSchema.parse(req.query);
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await examService.listExams(filter, userId);
      sendSuccess(res, result.exams, 'Lấy danh sách đề thi thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await examService.getExamDetail(examId, userId);
      sendSuccess(res, result, 'Lấy thông tin đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async questions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await examService.getExamQuestions(examId, userId);
      sendSuccess(res, result, 'Lấy danh sách câu hỏi phòng thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async customBuilder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validatedInput = customExamBuilderSchema.parse(req.body);
      const result = await examService.createCustomExam(userId, validatedInput);
      sendSuccess(res, result, 'Tạo bộ đề tùy biến thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async gradeGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
      const result = await examService.gradeGuestSubmission(examId, answers);
      sendSuccess(res, result, 'Chấm điểm bài thi thử thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async reportQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const { questionId, questionNumber, reason, note } = req.body || {};
      if (!reason || typeof reason !== 'string') {
        res.status(400).json({ success: false, message: 'Vui lòng chọn lý do báo lỗi' });
        return;
      }
      const result = await examService.reportQuestionIssue(
        examId,
        { questionId, questionNumber, reason, note },
        req
      );
      sendSuccess(res, result, 'Gửi báo cáo lỗi câu hỏi thành công', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const examController = new ExamController();
