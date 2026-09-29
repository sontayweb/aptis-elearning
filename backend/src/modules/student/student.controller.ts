import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';
import { z } from 'zod';

const updateGoalSchema = z.object({
  aim: z.string().optional(),
  examDate: z.string().optional(),
  dailyTarget: z.number().min(1).max(200).optional(),
});

export class StudentController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const result = await studentService.getDashboardStats(userId);
      sendSuccess(res, result, 'Lấy thông tin dashboard học viên thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getStreak(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await studentService.getStreak(userId);
      sendSuccess(res, result, 'Lấy chuỗi ngày streak học tập thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await studentService.getGoal(userId);
      sendSuccess(res, result, 'Lấy mục tiêu học tập thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = updateGoalSchema.parse(req.body);
      const result = await studentService.updateGoal(userId, data);
      sendSuccess(res, result, 'Cập nhật mục tiêu học tập thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
