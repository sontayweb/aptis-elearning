import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import {
  adminUserFilterSchema,
  adminCreateUserSchema,
  adminUpdateUserStatusSchema,
  adminCreateExamSchema,
  adminResolveTransactionSchema,
  adminCreateManualTransactionSchema,
  adminGrantVipSchema,
  adminResetPasswordSchema,
  adminAdjustQuotaSchema,
} from './admin.dto';
import { sendSuccess } from '../../utils/api-response';
import { TransactionStatus } from '@prisma/client';

export class AdminController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = adminUserFilterSchema.parse(req.query);
      const result = await adminService.listUsers(filter);
      sendSuccess(res, result.users, 'Lấy danh sách người dùng thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateUserSchema.parse(req.body);
      const user = await adminService.createUser(validatedInput, req);
      sendSuccess(res, user, 'Tạo tài khoản thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async bulkImportUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw { statusCode: 400, message: 'Vui lòng đính kèm tệp Excel (.xlsx, .csv)' };
      }
      const result = await adminService.bulkImportUsers(req.file.buffer, req);
      sendSuccess(res, result, 'Xử lý nhập học viên hàng loạt thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const { isActive } = adminUpdateUserStatusSchema.parse(req.body);
      const updated = await adminService.updateUserStatus(userId, isActive, req);
      sendSuccess(res, updated, 'Cập nhật trạng thái người dùng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async grantVip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminGrantVipSchema.parse(req.body);
      const subscription = await adminService.grantVip(userId, validatedInput, req);
      sendSuccess(res, subscription, 'Cấp quyền VIP thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminResetPasswordSchema.parse(req.body);
      const result = await adminService.resetPassword(userId, validatedInput, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async adjustQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminAdjustQuotaSchema.parse(req.body);
      const result = await adminService.adjustQuota(userId, validatedInput, req);
      sendSuccess(res, result, 'Cộng thêm lượt chấm thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const summary = await adminService.getUserSummary(userId);
      sendSuccess(res, summary, 'Lấy thông tin tổng hợp học viên thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateExamSchema.parse(req.body);
      const exam = await adminService.createExam(validatedInput, req);
      sendSuccess(res, exam, 'Tạo đề thi mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const result = await adminService.deleteExam(examId, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const updated = await adminService.updateExam(examId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async duplicateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const cloned = await adminService.duplicateExam(examId, req);
      sendSuccess(res, cloned, 'Nhân bản đề thi thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const status = req.query.status as TransactionStatus;
      const result = await adminService.listTransactions(page, limit, status);
      sendSuccess(res, result.transactions, 'Lấy danh sách giao dịch thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const txId = req.params.id;
      const validatedInput = adminResolveTransactionSchema.parse(req.body);
      const updated = await adminService.resolveTransaction(txId, validatedInput, req);
      sendSuccess(res, updated, 'Xử lý giao dịch thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createManualTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateManualTransactionSchema.parse(req.body);
      const created = await adminService.createManualTransaction(validatedInput, req);
      sendSuccess(res, created, 'Tạo giao dịch nạp tiền thủ công và kích hoạt VIP thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kpis = await adminService.getDashboardKPIs();
      sendSuccess(res, kpis, 'Lấy chỉ số KPI Dashboard thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 50);
      const skill = req.query.skill as string | undefined;
      const result = await adminService.listExams(page, limit, skill);
      sendSuccess(res, result.exams, 'Lấy danh sách đề thi thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await adminService.listPlans();
      sendSuccess(res, plans, 'Lấy danh sách gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planId = req.params.id;
      const updated = await adminService.updatePlan(planId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  // ── CONTENT EDITOR CONTROLLERS ─────────────────────────────────

  async getExamFull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const exam = await adminService.getExamFull(examId);
      sendSuccess(res, exam, 'Lấy nội dung đầy đủ đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const updated = await adminService.updatePart(partId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật phần thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async addPart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const part = await adminService.addPart(examId, req.body, req);
      sendSuccess(res, part, 'Thêm phần thi mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deletePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const result = await adminService.deletePart(partId, req);
      sendSuccess(res, result, 'Xóa phần thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const updated = await adminService.updateQuestion(questionId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật câu hỏi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const question = await adminService.addQuestion(partId, req.body, req);
      sendSuccess(res, question, 'Thêm câu hỏi thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const result = await adminService.deleteQuestion(questionId, req);
      sendSuccess(res, result, 'Xóa câu hỏi thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
