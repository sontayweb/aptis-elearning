"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportPaymentIssueSchema = exports.sepayWebhookSchema = exports.initiatePaymentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.initiatePaymentSchema = zod_1.z.object({
    planCode: zod_1.z.nativeEnum(client_1.PlanType),
});
exports.sepayWebhookSchema = zod_1.z.object({
    id: zod_1.z.number().or(zod_1.z.string()).optional(),
    gateway: zod_1.z.string().optional(),
    transactionDate: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    code: zod_1.z.string().nullable().optional(),
    content: zod_1.z.string().min(1, 'Nội dung chuyển khoản không được để trống'),
    transferType: zod_1.z.string().optional(),
    transferAmount: zod_1.z.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
    accumulated: zod_1.z.number().optional(),
    subAccount: zod_1.z.string().nullable().optional(),
    referenceCode: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.reportPaymentIssueSchema = zod_1.z.object({
    bankTransId: zod_1.z.string().min(2, 'Vui lòng cung cấp mã giao dịch hoặc mã FT của ngân hàng'),
    transferAmount: zod_1.z.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
    senderBank: zod_1.z.string().optional(),
    senderAccount: zod_1.z.string().optional(),
    transferTime: zod_1.z.string().optional(),
    receiptImageUrl: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
    contactPhone: zod_1.z.string().optional(),
});
