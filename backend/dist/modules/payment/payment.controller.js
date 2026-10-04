"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("./payment.service");
const payment_dto_1 = require("./payment.dto");
const api_response_1 = require("../../utils/api-response");
class PaymentController {
    async getPlans(req, res, next) {
        try {
            const plans = await payment_service_1.paymentService.getPlans();
            (0, api_response_1.sendSuccess)(res, plans, 'Lấy danh sách gói cước thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async initiate(req, res, next) {
        try {
            const userId = req.user.userId;
            const { planCode } = payment_dto_1.initiatePaymentSchema.parse(req.body);
            const result = await payment_service_1.paymentService.initiatePayment(userId, planCode);
            (0, api_response_1.sendSuccess)(res, result, 'Khởi tạo đơn hàng thanh toán thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const validatedPayload = payment_dto_1.sepayWebhookSchema.parse(req.body);
            const result = await payment_service_1.paymentService.handleWebhook(validatedPayload, req);
            if (!result.success) {
                (0, api_response_1.sendError)(res, result.message, 400);
                return;
            }
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async verify(req, res, next) {
        try {
            const userId = req.user?.userId;
            const { orderCode } = req.params;
            const result = await payment_service_1.paymentService.verifyTransaction(orderCode, userId, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async reportIssue(req, res, next) {
        try {
            const userId = req.user.userId;
            const { orderCode } = req.params;
            const validatedData = payment_dto_1.reportPaymentIssueSchema.parse(req.body);
            const result = await payment_service_1.paymentService.reportIssue(orderCode, validatedData, userId, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getStatus(req, res, next) {
        try {
            const { orderCode } = req.params;
            const result = await payment_service_1.paymentService.getOrderStatus(orderCode);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy trạng thái đơn hàng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async reconcile(req, res, next) {
        try {
            const result = await payment_service_1.paymentService.reconcilePendingTransactions(req);
            (0, api_response_1.sendSuccess)(res, result, 'Quét đối soát giao dịch nền hoàn tất', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getMySubscription(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await payment_service_1.paymentService.getMySubscription(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy thông tin gói cước thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactions(req, res, next) {
        try {
            const userId = req.user.userId;
            const transactions = await payment_service_1.paymentService.getTransactions(userId);
            (0, api_response_1.sendSuccess)(res, transactions, 'Lấy lịch sử giao dịch thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
