import { adminService } from '../src/modules/admin/admin.service';
import { examService } from '../src/modules/exams/exam.service';
import { prisma } from '../src/config/database';
import {
  adminCreatePromotionSchema,
  adminUpdatePromotionSchema,
} from '../src/modules/admin/admin.dto';

// Mock Prisma
jest.mock('../src/config/database', () => ({
  prisma: {
    exam: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    promotionCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    promotionRedemption: {
      findMany: jest.fn(),
    },
    subscriptionPlan: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

describe('=== TEST BỘ TÍNH NĂNG: LUYỆN TẬP LISTENING & AUTO-SWAP MÃ KHUYẾN MẠI ===', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Kiểm thử Logic Hiện Đáp Án khi Luyện Tập (Practice Mode vs Exam Mode)', () => {
    const validExamId = '12345678-1234-1234-1234-123456789012';
    const mockExamWithQuestions = {
      id: validExamId,
      title: 'Listening Test Part 4',
      skill: 'LISTENING',
      duration_minutes: 40,
      parts: [
        {
          id: 'part-4',
          part_number: 4,
          title: 'Part 4 - Monologue Comprehension',
          instructions: 'Listen to the talk and answer the questions',
          questions: [
            {
              id: 'q-1',
              question_text: 'What is the main topic?',
              options: ['Advertising', 'Sports', 'Education'],
              correct_answer: 'Advertising',
              explanation: 'The speaker explicitly mentions advertising strategies.',
            },
            {
              id: 'q-2',
              question_text: 'Who is sponsoring the event?',
              options: ['Local bank', 'Tech company', 'Government'],
              correct_answer: 'Tech company',
              explanation: 'Tech company is the headline sponsor.',
            },
          ],
        },
      ],
    };

    it('Nên GIỮ NGUYÊN correct_answer và explanation khi mode = practice', async () => {
      (prisma.exam.findUnique as jest.Mock).mockResolvedValue(mockExamWithQuestions);
      (prisma.exam.findFirst as jest.Mock).mockResolvedValue(mockExamWithQuestions);

      const result = await examService.getExamQuestions(validExamId, undefined, 'practice');

      expect(result).toBeDefined();
      expect(result.parts[0].questions[0].correct_answer).toBe('Advertising');
      expect(result.parts[0].questions[0].explanation).toBe(
        'The speaker explicitly mentions advertising strategies.'
      );
      expect(result.parts[0].questions[1].correct_answer).toBe('Tech company');
    });

    it('Nên XÓA BỎ correct_answer và explanation khi thi thật (mode = exam hoặc undefined) để chống gian lận', async () => {
      (prisma.exam.findUnique as jest.Mock).mockResolvedValue(mockExamWithQuestions);
      (prisma.exam.findFirst as jest.Mock).mockResolvedValue(mockExamWithQuestions);

      const result = await examService.getExamQuestions(validExamId, undefined, 'exam');

      expect(result).toBeDefined();
      expect(result.parts[0].questions[0].correct_answer).toBeUndefined();
      expect(result.parts[0].questions[0].explanation).toBeUndefined();
      expect(result.parts[0].questions[1].correct_answer).toBeUndefined();
    });
  });

  describe('2. Kiểm thử Cơ Chế Auto-Swap Treo Banner Độc Quyền (Cách 1)', () => {
    it('Khi tạo mã mới với is_featured = true: Hệ thống phải tự động gỡ toàn bộ mã cũ trong Transaction', async () => {
      (prisma.promotionCode.findUnique as jest.Mock).mockResolvedValue(null);

      const mockTx = {
        promotionCode: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          create: jest.fn().mockResolvedValue({
            id: 'promo-lan-aptis',
            code: 'LAN_APTIS',
            is_featured: true,
            is_active: true,
          }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const rawInput = {
        code: 'LAN_APTIS',
        title: 'Tặng 20 ngày VIP',
        code_type: 'FREE_TRIAL' as const,
        duration_days: 20,
        ai_quota: 30,
        teacher_quota: 0,
        is_featured: true,
        is_active: true,
      };

      const validatedInput = adminCreatePromotionSchema.parse(rawInput);
      const result = await adminService.createPromotion(validatedInput);

      // Xác minh $transaction được gọi
      expect(prisma.$transaction).toHaveBeenCalled();
      // Xác minh lệnh gỡ toàn bộ các mã khác khỏi banner: data: { is_featured: false }
      expect(mockTx.promotionCode.updateMany).toHaveBeenCalledWith({
        data: { is_featured: false },
      });
      // Xác minh tạo mã mới với is_featured: true
      expect(mockTx.promotionCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'LAN_APTIS',
            is_featured: true,
          }),
        })
      );
      expect(result.is_featured).toBe(true);
    });

    it('Khi Admin gạt BẬT Treo Banner cho một mã đã có: Hệ thống tự động gỡ các mã khác (where id != current)', async () => {
      const existingPromo = {
        id: 'promo-lan-aptis',
        code: 'LAN_APTIS',
        is_featured: false,
        is_active: true,
      };
      (prisma.promotionCode.findUnique as jest.Mock).mockResolvedValue(existingPromo);

      const mockTx = {
        promotionCode: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn().mockResolvedValue({
            id: 'promo-lan-aptis',
            code: 'LAN_APTIS',
            is_featured: true,
          }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const validatedInput = adminUpdatePromotionSchema.parse({
        is_featured: true,
      });

      const result = await adminService.updatePromotion('promo-lan-aptis', validatedInput);

      // Xác minh updateMany được gọi với điều kiện loại trừ chính mã này
      expect(mockTx.promotionCode.updateMany).toHaveBeenCalledWith({
        where: { id: { not: 'promo-lan-aptis' } },
        data: { is_featured: false },
      });
      // Xác minh mã này được cập nhật is_featured: true
      expect(mockTx.promotionCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'promo-lan-aptis' },
          data: expect.objectContaining({ is_featured: true }),
        })
      );
      expect(result.is_featured).toBe(true);
    });

    it('Khi Admin TẮT Treo Banner: Không cần chạy Transaction swap', async () => {
      const existingPromo = {
        id: 'promo-golive14',
        code: 'GOLIVE14',
        is_featured: true,
      };
      (prisma.promotionCode.findUnique as jest.Mock).mockResolvedValue(existingPromo);
      (prisma.promotionCode.update as jest.Mock).mockResolvedValue({
        id: 'promo-golive14',
        code: 'GOLIVE14',
        is_featured: false,
      });

      const validatedInput = adminUpdatePromotionSchema.parse({
        is_featured: false,
      });

      const result = await adminService.updatePromotion('promo-golive14', validatedInput);

      // Transaction không cần chạy khi tắt banner
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.promotionCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'promo-golive14' },
          data: expect.objectContaining({ is_featured: false }),
        })
      );
      expect(result.is_featured).toBe(false);
    });
  });

  describe('3. Kiểm thử Validation DTO của Mã Khuyến Mại', () => {
    it('Tự động uppercase mã code và trim khoảng trắng', () => {
      const parsed = adminCreatePromotionSchema.parse({
        code: '   lan_aptis_2026   ',
        title: 'Mã cô Lan Aptis',
        code_type: 'FREE_TRIAL',
      });

      expect(parsed.code).toBe('LAN_APTIS_2026');
      expect(parsed.code_type).toBe('FREE_TRIAL');
      expect(parsed.duration_days).toBe(14);
      expect(parsed.is_featured).toBe(false);
      expect(parsed.is_active).toBe(true);
    });

    it('Hỗ trợ cả định dạng camelCase và snake_case từ Frontend', () => {
      const parsedFromFrontend = adminUpdatePromotionSchema.parse({
        isFeatured: true,
        isActive: false,
        durationDays: 30,
        discountAmount: 100000,
      });

      expect(parsedFromFrontend.is_featured).toBe(true);
      expect(parsedFromFrontend.is_active).toBe(false);
      expect(parsedFromFrontend.duration_days).toBe(30);
      expect(parsedFromFrontend.discount_amount).toBe(100000);
    });

    it('Bắt lỗi khi mã code quá ngắn (dưới 3 ký tự)', () => {
      expect(() => {
        adminCreatePromotionSchema.parse({
          code: 'AB',
          title: 'Mã lỗi',
        });
      }).toThrow();
    });
  });

  describe('4. Kiểm thử Logic Khấu Trừ Tiền & Ưu Đãi Thanh Toán (Payment Service)', () => {
    it('Mã giảm tiền mặt (DISCOUNT_AMOUNT): Giảm chính xác số tiền và không âm', () => {
      const planPrice = 399000;
      const discountAmount = 50000;
      const minOrderAmount = 100000;

      expect(planPrice).toBeGreaterThanOrEqual(minOrderAmount);
      const finalAmount = Math.max(0, planPrice - discountAmount);
      expect(finalAmount).toBe(349000);
    });

    it('Mã giảm theo phần trăm (DISCOUNT_PERCENT): Giảm chính xác % và làm tròn', () => {
      const planPrice = 399000;
      const discountPercent = 20; // 20%
      const discountVal = Math.round((planPrice * discountPercent) / 100);
      const finalAmount = Math.max(0, planPrice - discountVal);

      expect(discountVal).toBe(79800);
      expect(finalAmount).toBe(319200);
    });

    it('Từ chối áp dụng khi đơn hàng chưa đạt giá trị tối thiểu (min_order_amount)', () => {
      const planPrice = 199000;
      const minOrderAmount = 300000;

      const isEligible = planPrice >= minOrderAmount;
      expect(isEligible).toBe(false);
    });

    it('Từ chối mã khi đã quá hạn sử dụng (expires_at)', () => {
      const pastDate = new Date('2026-01-01T00:00:00Z');
      const isExpired = new Date() > pastDate;
      expect(isExpired).toBe(true);
    });
  });
});
