import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { initiatePaymentSchema, sepayWebhookSchema, reportPaymentIssueSchema } from './payment.dto';
import { sendSuccess, sendError } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class PaymentController {
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await paymentService.getPlans();
      sendSuccess(res, plans, 'Lấy danh sách gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async initiate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { planCode } = initiatePaymentSchema.parse(req.body);
      const result = await paymentService.initiatePayment(userId, planCode);
      sendSuccess(res, result, 'Khởi tạo đơn hàng thanh toán thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedPayload = sepayWebhookSchema.parse(req.body);
      const result = await paymentService.handleWebhook(validatedPayload, req);
      if (!result.success) {
        sendError(res, result.message, 400);
        return;
      }
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async verify(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { orderCode } = req.params;
      const result = await paymentService.verifyTransaction(orderCode, userId, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async reportIssue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { orderCode } = req.params;
      const validatedData = reportPaymentIssueSchema.parse(req.body);
      const result = await paymentService.reportIssue(orderCode, validatedData, userId, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderCode } = req.params;
      const result = await paymentService.getOrderStatus(orderCode);
      sendSuccess(res, result, 'Lấy trạng thái đơn hàng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async reconcile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.reconcilePendingTransactions(req);
      sendSuccess(res, result, 'Quét đối soát giao dịch nền hoàn tất', 200);
    } catch (error) {
      next(error);
    }
  }

  async getMySubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await paymentService.getMySubscription(userId);
      sendSuccess(res, result, 'Lấy thông tin gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const transactions = await paymentService.getTransactions(userId);
      sendSuccess(res, transactions, 'Lấy lịch sử giao dịch thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();

