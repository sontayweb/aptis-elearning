import { z } from 'zod';
import { UserRole, ExamSkill, QuestionType, TransactionStatus, TargetBand } from '@prisma/client';

export const adminUserFilterSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  phoneNumber: z.string().optional(),
  targetBand: z.nativeEnum(TargetBand).optional(),
  internalNotes: z.string().optional(),
});

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
