import { Request, Response, NextFunction } from 'express';
import { courseService } from './course.service';
import { registerLeadSchema, updateLeadStatusSchema } from './course.dto';
import { sendSuccess, sendError } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class CourseController {
  /**
   * GET /api/courses/featured-fasttrack
   * Lấy thông tin lớp cấp tốc B2 và 5 đợt mở lớp gần nhất
   */
  async getFeaturedFasttrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await courseService.getFeaturedFasttrackCourse();
      sendSuccess(res, data, 'Lấy thông tin đợt khai giảng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/courses/leads/register
   * Học viên đăng ký giữ chỗ / nhận tư vấn
   */
  async registerLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerLeadSchema.parse(req.body);
      const userId = (req as AuthenticatedRequest).user?.userId;

      const result = await courseService.registerLead(validated, userId);
      sendSuccess(res, result, result.message, 201);
    } catch (error: any) {
      if (error?.errors) {
        sendError(res, error.errors[0]?.message || 'Dữ liệu không hợp lệ', 400, error.errors);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/courses/leads (ADMIN)
   * Quản lý danh sách học viên đăng ký
   */
  async getLeads(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as any;
      const batchId = req.query.batchId as string | undefined;

      const result = await courseService.getLeads({ page, limit, status, batchId });
      sendSuccess(res, result.leads, 'Lấy danh sách đăng ký tư vấn thành công', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/courses/leads/:id/status (ADMIN)
   * Cập nhật trạng thái xử lý tư vấn
   */
  async updateLeadStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leadId = req.params.id;
      const validated = updateLeadStatusSchema.parse(req.body);
      const adminId = req.user?.userId;

      const result = await courseService.updateLeadStatus(leadId, validated, adminId, req);
      sendSuccess(res, result, 'Cập nhật trạng thái tư vấn thành công', 200);
    } catch (error: any) {
      if (error?.errors) {
        sendError(res, error.errors[0]?.message || 'Dữ liệu không hợp lệ', 400, error.errors);
        return;
      }
      next(error);
    }
  }
}

export const courseController = new CourseController();
