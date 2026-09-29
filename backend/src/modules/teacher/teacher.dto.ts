import { z } from 'zod';

export const gradeSubmissionSchema = z.object({
  totalScore: z.number().min(0).max(50, 'Điểm tối đa là 50 theo chuẩn Aptis'),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  teacherFeedback: z.string().min(5, 'Nhận xét phải có ít nhất 5 ký tự'),
  answersFeedback: z
    .array(
      z.object({
        answerId: z.string().uuid(),
        score: z.number().min(0),
        feedback: z.string().optional(),
      })
    )
    .optional(),
});

export const createClassroomSchema = z.object({
  name: z.string().min(3, 'Tên lớp học phải có ít nhất 3 ký tự'),
  description: z.string().optional(),
});

export const joinClassroomSchema = z.object({
  classCode: z.string().min(3, 'Mã lớp không hợp lệ'),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type JoinClassroomInput = z.infer<typeof joinClassroomSchema>;
