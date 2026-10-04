"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customExamBuilderSchema = exports.examFilterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.examFilterSchema = zod_1.z.object({
    skill: zod_1.z.nativeEnum(client_1.ExamSkill).optional(),
    isPro: zod_1.z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    source: zod_1.z.string().optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('20').transform(Number),
});
exports.customExamBuilderSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Tên bộ đề phải có ít nhất 3 ký tự'),
    description: zod_1.z.string().optional(),
    skill: zod_1.z.nativeEnum(client_1.ExamSkill).default(client_1.ExamSkill.FULL_TEST),
    durationMinutes: zod_1.z.number().min(5).max(300).default(60),
    partIds: zod_1.z.array(zod_1.z.string()).min(1, 'Phải chọn ít nhất 1 phần thi (Part)'),
});
