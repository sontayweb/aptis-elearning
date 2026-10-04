"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateVocabWordSchema = exports.adminCreateVocabWordSchema = exports.adminUpdatePlanSchema = exports.adminAdjustQuotaSchema = exports.adminResetPasswordSchema = exports.adminGrantVipSchema = exports.adminCreateManualTransactionSchema = exports.adminResolveTransactionSchema = exports.adminCreateExamSchema = exports.adminUpdateUserStatusSchema = exports.adminCreateUserSchema = exports.adminUserFilterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.adminUserFilterSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('20').transform(Number),
});
exports.adminCreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.nativeEnum(client_1.UserRole).default(client_1.UserRole.STUDENT),
    phoneNumber: zod_1.z.string().optional(),
    targetBand: zod_1.z.nativeEnum(client_1.TargetBand).optional(),
    internalNotes: zod_1.z.string().optional(),
});
exports.adminUpdateUserStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
exports.adminCreateExamSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().optional(),
    skill: zod_1.z.nativeEnum(client_1.ExamSkill),
    durationMinutes: zod_1.z.number().min(5).max(300),
    isPro: zod_1.z.boolean().default(false),
    parts: zod_1.z
        .array(zod_1.z.object({
        partNumber: zod_1.z.number(),
        title: zod_1.z.string(),
        instructions: zod_1.z.string().optional(),
        passageText: zod_1.z.string().optional(),
        audioUrl: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().optional(),
        questions: zod_1.z.array(zod_1.z.object({
            questionNumber: zod_1.z.number(),
            questionType: zod_1.z.nativeEnum(client_1.QuestionType),
            prompt: zod_1.z.string(),
            options: zod_1.z.array(zod_1.z.string()).optional(),
            correctAnswer: zod_1.z.string().optional(),
            explanation: zod_1.z.string().optional(),
            maxScore: zod_1.z.number().default(1.0),
        })),
    }))
        .min(1, 'Đề thi phải có ít nhất 1 phần thi'),
});
exports.adminResolveTransactionSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TransactionStatus),
    note: zod_1.z.string().optional(),
    targetUserId: zod_1.z.string().optional(),
});
exports.adminCreateManualTransactionSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'Vui lòng chọn học viên'),
    amount: zod_1.z.number().min(1000, 'Số tiền tối thiểu 1.000 VND'),
    planId: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().default('MANUAL_BANK_TRANSFER'),
    note: zod_1.z.string().optional(),
});
exports.adminGrantVipSchema = zod_1.z.object({
    days: zod_1.z.number().min(1).default(30),
    planId: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
exports.adminResetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(6).default('Aptis123'),
});
exports.adminAdjustQuotaSchema = zod_1.z.object({
    aiQuota: zod_1.z.number().min(0),
    teacherQuota: zod_1.z.number().min(0).optional(),
    reason: zod_1.z.string().optional(),
});
exports.adminUpdatePlanSchema = zod_1.z.object({
    price_vnd: zod_1.z.number().optional(),
    ai_quota: zod_1.z.number().optional(),
    teacher_quota: zod_1.z.number().optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.adminCreateVocabWordSchema = zod_1.z.object({
    setId: zod_1.z.string(),
    word: zod_1.z.string().min(1),
    phonetic: zod_1.z.string().optional(),
    meaningVi: zod_1.z.string().min(1),
    exampleSentence: zod_1.z.string().optional(),
    cefrLevel: zod_1.z.string().default('B1'),
});
exports.adminUpdateVocabWordSchema = zod_1.z.object({
    word: zod_1.z.string().min(1).optional(),
    phonetic: zod_1.z.string().optional(),
    meaningVi: zod_1.z.string().min(1).optional(),
    exampleSentence: zod_1.z.string().optional(),
});
