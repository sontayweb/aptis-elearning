import { z } from 'zod';

export const startSubmissionSchema = z.object({
  examId: z.string().uuid('Exam ID không hợp lệ'),
});

export const autosaveAnswerSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOption: z.string().nullable().optional(),
      textAnswer: z.string().nullable().optional(),
      audioUrl: z.string().nullable().optional(),
      audioDuration: z.number().nullable().optional(),
    })
  ),
});

export const heartbeatSchema = z.object({
  tabSwitchCount: z.number().optional().default(0),
});

export const myHistoryFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  skill: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export type StartSubmissionInput = z.infer<typeof startSubmissionSchema>;
export type AutosaveAnswerInput = z.infer<typeof autosaveAnswerSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type MyHistoryFilterInput = z.infer<typeof myHistoryFilterSchema>;

