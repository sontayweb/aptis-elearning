import { Request, Response, NextFunction } from 'express';
import { aiGradingService } from './ai-grading.service';
import { sendSuccess } from '../../utils/api-response';

export class AiGradingController {
  async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissionId = req.params.id;
      const user = (req as any).user;
      const result = await aiGradingService.evaluateSubmission(
        submissionId,
        user?.userId,
        user?.role
      );
      sendSuccess(res, result, 'Đánh giá AI hoàn tất thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissionId = req.params.id;
      const user = (req as any).user;
      const feedback = await aiGradingService.getAiFeedback(
        submissionId,
        user?.userId,
        user?.role
      );
      sendSuccess(res, feedback, 'Lấy kết quả đánh giá AI thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const aiGradingController = new AiGradingController();
