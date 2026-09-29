import { z } from 'zod';
import { ExamSkill } from '@prisma/client';

export const examFilterSchema = z.object({
  skill: z.nativeEnum(ExamSkill).optional(),
  isPro: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  source: z.enum(['WEB', 'CUSTOM', 'KEY']).optional().default('WEB'),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export const customExamBuilderSchema = z.object({
  title: z.string().min(3, 'Tên bộ đề phải có ít nhất 3 ký tự'),
  description: z.string().optional(),
  skill: z.nativeEnum(ExamSkill).default(ExamSkill.FULL_TEST),
  durationMinutes: z.number().min(5).max(300).default(60),
  partIds: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 phần thi (Part)'),
});

export type ExamFilterInput = z.infer<typeof examFilterSchema>;
export type CustomExamBuilderInput = z.infer<typeof customExamBuilderSchema>;
