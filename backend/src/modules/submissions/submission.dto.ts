import { z } from 'zod';

export const startSubmissionSchema = z.object({
  examId: z.string().min(1, 'Exam ID không được để trống'),
  forceNew: z.boolean().optional().default(false),
});

export const autosaveAnswerSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOption: z.string().max(50, 'Lựa chọn không hợp lệ').nullable().optional(),
        textAnswer: z
          .string()
          .max(3000, 'Bài viết vượt quá giới hạn 3,000 ký tự cho phép')
          .nullable()
          .optional(),
        audioUrl: z.string().max(1000).nullable().optional(),
        audioDuration: z.number().max(600).nullable().optional(),
      })
    )
    .max(50, 'Không được gửi quá 50 câu trả lời trong một lần autosave'),
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

