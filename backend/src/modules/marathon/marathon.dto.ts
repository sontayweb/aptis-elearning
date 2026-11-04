import { z } from 'zod';
import { ExamSkill } from '@prisma/client';

export const MarathonQuerySchema = z.object({
  skill: z.nativeEnum(ExamSkill).default(ExamSkill.READING),
  part: z.coerce.number().int().min(1).max(5).default(1),
});

export const MarathonBatchQuerySchema = z.object({
  skill: z.nativeEnum(ExamSkill).default(ExamSkill.READING),
  part: z.coerce.number().int().min(1).max(5).default(1),
  indices: z.string().transform((val) =>
    val
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x))
  ),
});

export const MarathonAutosaveSchema = z.object({
  skill: z.nativeEnum(ExamSkill),
  partNumber: z.number().int().min(1).max(5),
  currentExamIndex: z.number().int().min(0),
  currentExamId: z.string().optional(),
  currentDraftAnswers: z.record(z.any()).default({}),
  currentDraftOrders: z.record(z.any()).optional().default({}),
  additionalTimeSeconds: z.number().int().min(0).default(0),
});

export const MarathonCompleteExamSchema = z.object({
  skill: z.nativeEnum(ExamSkill),
  partNumber: z.number().int().min(1).max(5),
  examId: z.string(),
  examIndex: z.number().int().min(0),
  answers: z.record(z.any()).default({}),
  orders: z.record(z.any()).optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
});

export const MarathonResetSchema = z.object({
  skill: z.nativeEnum(ExamSkill),
  partNumber: z.number().int().min(1).max(5),
  scope: z.enum(['EXAM', 'ALL']).default('ALL'),
  examId: z.string().optional(),
});

