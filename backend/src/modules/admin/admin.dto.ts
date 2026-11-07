import { z } from 'zod';
import { UserRole, ExamSkill, QuestionType, TransactionStatus, TargetBand } from '@prisma/client';

export const adminUserFilterSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export const adminCreateUserSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        fullName: val.fullName || val.full_name,
        phoneNumber: val.phoneNumber || val.phone || val.phone_number,
      };
    }
    return val;
  },
  z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
    phoneNumber: z.string().optional(),
    targetBand: z.nativeEnum(TargetBand).optional(),
    internalNotes: z.string().optional(),
  })
);

export const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminCreateExamSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  skill: z.nativeEnum(ExamSkill),
  durationMinutes: z.number().min(5).max(300),
  isPro: z.boolean().default(false),
  hotLevel: z.number().min(0).max(5).default(0).optional(),
  forecastTag: z.string().optional(),
  parts: z
    .array(
      z.object({
        partNumber: z.number(),
        title: z.string(),
        instructions: z.string().optional(),
        passageText: z.string().optional(),
        audioUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        questions: z.array(
          z.object({
            questionNumber: z.number(),
            questionType: z.nativeEnum(QuestionType),
            prompt: z.string(),
            options: z.array(z.string()).optional(),
            correctAnswer: z.string().optional(),
            explanation: z.string().optional(),
            maxScore: z.number().default(1.0),
          })
        ),
      })
    )
    .min(1, 'Đề thi phải có ít nhất 1 phần thi'),
});

export const adminResolveTransactionSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
  note: z.string().optional(),
  targetUserId: z.string().optional(),
  planId: z.string().optional(),
});

export const adminCreateManualTransactionSchema = z.object({
  userId: z.string().min(1, 'Vui lòng chọn học viên'),
  amount: z.number().min(1000, 'Số tiền tối thiểu 1.000 VND'),
  planId: z.string().optional(),
  paymentMethod: z.string().default('MANUAL_BANK_TRANSFER'),
  note: z.string().optional(),
});

export const adminGrantVipSchema = z.object({
  days: z.number().min(1).default(30),
  planId: z.string().optional(),
  reason: z.string().optional(),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6).default('Aptis123'),
});

export const adminAdjustQuotaSchema = z.object({
  aiQuota: z.number().min(0),
  teacherQuota: z.number().min(0).optional(),
  reason: z.string().optional(),
});

export const adminUpdatePlanSchema = z.object({
  price_vnd: z.number().optional(),
  ai_quota: z.number().optional(),
  teacher_quota: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const adminCreateVocabWordSchema = z.object({
  setId: z.string(),
  word: z.string().min(1),
  phonetic: z.string().optional(),
  meaningVi: z.string().min(1),
  exampleSentence: z.string().optional(),
  cefrLevel: z.string().default('B1'),
});

export const adminUpdateVocabWordSchema = z.object({
  word: z.string().min(1).optional(),
  phonetic: z.string().optional(),
  meaningVi: z.string().min(1).optional(),
  exampleSentence: z.string().optional(),
});

export type AdminUserFilterInput = z.infer<typeof adminUserFilterSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserStatusInput = z.infer<typeof adminUpdateUserStatusSchema>;
export type AdminCreateExamInput = z.infer<typeof adminCreateExamSchema>;
export type AdminResolveTransactionInput = z.infer<typeof adminResolveTransactionSchema>;
export type AdminCreateManualTransactionInput = z.infer<typeof adminCreateManualTransactionSchema>;
export type AdminGrantVipInput = z.infer<typeof adminGrantVipSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
export type AdminAdjustQuotaInput = z.infer<typeof adminAdjustQuotaSchema>;
export type AdminUpdatePlanInput = z.infer<typeof adminUpdatePlanSchema>;
export type AdminCreateVocabWordInput = z.infer<typeof adminCreateVocabWordSchema>;
export type AdminUpdateVocabWordInput = z.infer<typeof adminUpdateVocabWordSchema>;

export const adminCreatePromotionSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Mã khuyến mại phải có ít nhất 3 ký tự')
      .max(30, 'Mã khuyến mại không vượt quá 30 ký tự')
      .transform((val) => val.trim().toUpperCase()),
    title: z.string().min(2, 'Tiêu đề mã khuyến mại không được để trống'),
    description: z.string().optional().nullable(),
    code_type: z.enum(['FREE_TRIAL', 'DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT']).optional(),
    codeType: z.enum(['FREE_TRIAL', 'DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT']).optional(),
    plan_id: z.string().optional().nullable(),
    planId: z.string().optional().nullable(),
    duration_days: z.number().int().min(1).optional(),
    durationDays: z.number().int().min(1).optional(),
    ai_quota: z.number().int().min(0).optional(),
    aiQuota: z.number().int().min(0).optional(),
    teacher_quota: z.number().int().min(0).optional(),
    teacherQuota: z.number().int().min(0).optional(),
    discount_amount: z.number().int().min(0).optional().nullable(),
    discountAmount: z.number().int().min(0).optional().nullable(),
    discount_percent: z.number().int().min(1).max(100).optional().nullable(),
    discountPercent: z.number().int().min(1).max(100).optional().nullable(),
    min_order_amount: z.number().int().min(0).optional().nullable(),
    minOrderAmount: z.number().int().min(0).optional().nullable(),
    is_featured: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
    max_uses: z.number().int().min(1).optional().nullable(),
    maxUses: z.number().int().min(1).optional().nullable(),
    expires_at: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  })
  .transform((data) => ({
    code: data.code,
    title: data.title,
    description: data.description,
    code_type: data.code_type ?? data.codeType ?? 'FREE_TRIAL',
    plan_id: data.plan_id ?? data.planId ?? null,
    duration_days: data.duration_days ?? data.durationDays ?? 14,
    ai_quota: data.ai_quota ?? data.aiQuota ?? 20,
    teacher_quota: data.teacher_quota ?? data.teacherQuota ?? 0,
    discount_amount: data.discount_amount ?? data.discountAmount ?? null,
    discount_percent: data.discount_percent ?? data.discountPercent ?? null,
    min_order_amount: data.min_order_amount ?? data.minOrderAmount ?? null,
    is_featured: data.is_featured ?? data.isFeatured ?? false,
    is_active: data.is_active ?? data.isActive ?? true,
    max_uses: data.max_uses ?? data.maxUses ?? null,
    expires_at: data.expires_at ?? data.expiresAt ?? null,
  }));

export const adminUpdatePromotionSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    code_type: z.enum(['FREE_TRIAL', 'DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT']).optional(),
    codeType: z.enum(['FREE_TRIAL', 'DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT']).optional(),
    plan_id: z.string().optional().nullable(),
    planId: z.string().optional().nullable(),
    duration_days: z.number().int().min(1).optional(),
    durationDays: z.number().int().min(1).optional(),
    ai_quota: z.number().int().min(0).optional(),
    aiQuota: z.number().int().min(0).optional(),
    teacher_quota: z.number().int().min(0).optional(),
    teacherQuota: z.number().int().min(0).optional(),
    discount_amount: z.number().int().min(0).optional().nullable(),
    discountAmount: z.number().int().min(0).optional().nullable(),
    discount_percent: z.number().int().min(1).max(100).optional().nullable(),
    discountPercent: z.number().int().min(1).max(100).optional().nullable(),
    min_order_amount: z.number().int().min(0).optional().nullable(),
    minOrderAmount: z.number().int().min(0).optional().nullable(),
    is_featured: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
    max_uses: z.number().int().min(1).optional().nullable(),
    maxUses: z.number().int().min(1).optional().nullable(),
    expires_at: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  })
  .transform((data) => ({
    title: data.title,
    description: data.description,
    code_type: data.code_type ?? data.codeType,
    plan_id: data.plan_id ?? data.planId,
    duration_days: data.duration_days ?? data.durationDays,
    ai_quota: data.ai_quota ?? data.aiQuota,
    teacher_quota: data.teacher_quota ?? data.teacherQuota,
    discount_amount: data.discount_amount ?? data.discountAmount,
    discount_percent: data.discount_percent ?? data.discountPercent,
    min_order_amount: data.min_order_amount ?? data.minOrderAmount,
    is_featured: data.is_featured ?? data.isFeatured,
    is_active: data.is_active ?? data.isActive,
    max_uses: data.max_uses ?? data.maxUses,
    expires_at: data.expires_at ?? data.expiresAt,
  }));

export type AdminCreatePromotionInput = z.infer<typeof adminCreatePromotionSchema>;
export type AdminUpdatePromotionInput = z.infer<typeof adminUpdatePromotionSchema>;
