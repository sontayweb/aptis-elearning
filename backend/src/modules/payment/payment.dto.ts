import { z } from 'zod';
import { PlanType } from '@prisma/client';

export const initiatePaymentSchema = z
  .object({
    planCode: z.nativeEnum(PlanType).optional(),
    planId: z.string().optional(),
    plan_id: z.string().optional(),
    promoCode: z.string().nullable().optional(),
    promo_code: z.string().nullable().optional(),
  })
  .refine((data) => Boolean(data.planCode || data.planId || data.plan_id), {
    message: 'Vui lòng chọn gói cước hợp lệ (planCode hoặc planId)',
  });

export const sepayWebhookSchema = z.object({
  id: z.union([z.number(), z.string()]).nullable().optional(),
  gateway: z.string().nullable().optional(),
  transactionDate: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  content: z.string().min(1, 'Nội dung chuyển khoản không được để trống'),
  transferType: z.string().nullable().optional(),
  transferAmount: z.coerce.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
  accumulated: z.coerce.number().nullable().optional(),
  subAccount: z.string().nullable().optional(),
  referenceCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type SepayWebhookInput = z.infer<typeof sepayWebhookSchema>;

export const reportPaymentIssueSchema = z.object({
  bankTransId: z.string().min(2, 'Vui lòng cung cấp mã giao dịch hoặc mã FT của ngân hàng'),
  transferAmount: z.coerce.number().positive('Số tiền chuyển khoản phải lớn hơn 0'),
  senderBank: z.string().nullable().optional(),
  senderAccount: z.string().nullable().optional(),
  transferTime: z.string().nullable().optional(),
  receiptImageUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
});

export type ReportPaymentIssueInput = z.infer<typeof reportPaymentIssueSchema>;

export const redeemPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Mã kích hoạt phải có ít nhất 3 ký tự')
    .max(30, 'Mã kích hoạt không vượt quá 30 ký tự')
    .transform((val) => val.trim().toUpperCase()),
});

export type RedeemPromoCodeInput = z.infer<typeof redeemPromoCodeSchema>;

