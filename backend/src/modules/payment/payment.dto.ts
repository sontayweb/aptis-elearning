import { z } from 'zod';
import { PlanType } from '@prisma/client';

export const initiatePaymentSchema = z.object({
  planCode: z.nativeEnum(PlanType),
});

export const sepayWebhookSchema = z.object({
  id: z.number().or(z.string()).optional(),
  gateway: z.string().optional(),
  transactionDate: z.string().optional(),
  accountNumber: z.string().optional(),
  code: z.string().nullable().optional(),
  content: z.string().min(1, 'Nội dung chuyển khoản không được để trống'),
  transferType: z.string().optional(),
  transferAmount: z.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
  accumulated: z.number().optional(),
  subAccount: z.string().nullable().optional(),
  referenceCode: z.string().optional(),
  description: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type SepayWebhookInput = z.infer<typeof sepayWebhookSchema>;

export const reportPaymentIssueSchema = z.object({
  bankTransId: z.string().min(2, 'Vui lòng cung cấp mã giao dịch hoặc mã FT của ngân hàng'),
  transferAmount: z.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
  senderBank: z.string().optional(),
  senderAccount: z.string().optional(),
  transferTime: z.string().optional(),
  receiptImageUrl: z.string().optional(),
  note: z.string().optional(),
  contactPhone: z.string().optional(),
});

export type ReportPaymentIssueInput = z.infer<typeof reportPaymentIssueSchema>;

