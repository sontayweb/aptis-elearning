import { z } from 'zod';

export const registerLeadSchema = z.object({
  courseId: z.string().uuid('ID khóa học không hợp lệ').optional(),
  courseCode: z.string().optional(),
  batchId: z.string().uuid('ID đợt khai giảng không hợp lệ').optional(),
  batchDateStr: z.string().optional(),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100, 'Họ và tên tối đa 100 ký tự'),
  phoneNumber: z
    .string()
    .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ theo chuẩn Việt Nam'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  targetBand: z.string().optional(),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

export const createBatchSchema = z.object({
  courseId: z.string().uuid('ID khóa học không hợp lệ'),
  batchCode: z.string().min(3, 'Mã đợt tối thiểu 3 ký tự'),
  displayDate: z.string().min(3, 'Ngày hiển thị (ví dụ 15/10)'),
  openingDate: z.string().datetime({ message: 'Ngày khai giảng phải đúng chuẩn ISO' }),
  scheduleTime: z.string().optional(),
  maxSeats: z.number().int().min(1).max(100).default(15),
  isHot: z.boolean().default(false),
  orderNum: z.number().int().default(0),
});

export const updateBatchStatusSchema = z.object({
  status: z.enum(['UPCOMING', 'OPEN', 'ALMOST_FULL', 'FULL', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  enrolledSeats: z.number().int().min(0).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'CONSULTING', 'ENROLLED', 'CANCELLED']),
  assignedAdmin: z.string().optional(),
  note: z.string().optional(),
});

export type RegisterLeadInput = z.infer<typeof registerLeadSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchStatusInput = z.infer<typeof updateBatchStatusSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
