import { prisma } from '../../config/database';
import { BatchStatus, LeadConsultationStatus, CourseFormat, TargetBand, AuditAction } from '@prisma/client';
import { RegisterLeadInput, CreateBatchInput, UpdateBatchStatusInput, UpdateLeadStatusInput } from './course.dto';
import { auditService } from '../audit/audit.service';
import { Request } from 'express';

export class CourseService {
  /**
   * Lấy thông tin lớp cấp tốc B2 tiêu biểu & các đợt khai giảng sắp tới phục vụ Dashboard Banner
   */
  async getFeaturedFasttrackCourse() {
    let course = await prisma.course.findFirst({
      where: { code: 'APTIS_B2_FASTTRACK', is_active: true },
      include: {
        batches: {
          where: {
            status: { in: [BatchStatus.OPEN, BatchStatus.ALMOST_FULL, BatchStatus.UPCOMING] },
          },
          orderBy: { order_num: 'asc' },
          take: 5,
        },
      },
    });

    // Nếu CSDL chưa có, khởi tạo seed dữ liệu mặc định chuẩn theo thiết kế doanh nghiệp
    if (!course) {
      course = await prisma.course.create({
        data: {
          code: 'APTIS_B2_FASTTRACK',
          title: 'Lớp online APTIS ESOL B2',
          subtitle: 'ÔN CẤP TỐC ĐẠT MỤC TIÊU B2',
          target_band: TargetBand.B2_TARGET,
          format: CourseFormat.ONLINE_LIVE,
          original_price: 1500000,
          sale_price: 990000,
          discount_percent: 35,
          max_students: 15,
          features: [
            'Học trực tuyến tương tác cao',
            'Có bài giảng xem lại sau mỗi buổi',
            'Web luyện + Bộ đề khoanh vùng',
            'Tài liệu & đáp án chi tiết',
            'Giáo viên chữa bài & đồng hành tận tình',
          ],
          is_active: true,
          display_order: 1,
          batches: {
            create: [
              {
                batch_code: 'B2-2026-10-15',
                display_date: '15/10',
                opening_date: new Date('2026-10-15T19:30:00Z'),
                schedule_time: 'Tối 2-4-6 (19:30 - 21:30)',
                max_seats: 15,
                enrolled_seats: 12,
                status: BatchStatus.ALMOST_FULL,
                is_hot: true,
                order_num: 1,
              },
              {
                batch_code: 'B2-2026-10-25',
                display_date: '25/10',
                opening_date: new Date('2026-10-25T19:30:00Z'),
                schedule_time: 'Tối 3-5-7 (19:30 - 21:30)',
                max_seats: 15,
                enrolled_seats: 6,
                status: BatchStatus.OPEN,
                is_hot: false,
                order_num: 2,
              },
              {
                batch_code: 'B2-2026-11-05',
                display_date: '05/11',
                opening_date: new Date('2026-11-05T19:30:00Z'),
                schedule_time: 'Tối 2-4-6 (19:30 - 21:30)',
                max_seats: 15,
                enrolled_seats: 2,
                status: BatchStatus.OPEN,
                is_hot: false,
                order_num: 3,
              },
              {
                batch_code: 'B2-2026-11-15',
                display_date: '15/11',
                opening_date: new Date('2026-11-15T19:30:00Z'),
                schedule_time: 'Tối 3-5-7 (19:30 - 21:30)',
                max_seats: 15,
                enrolled_seats: 0,
                status: BatchStatus.OPEN,
                is_hot: false,
                order_num: 4,
              },
              {
                batch_code: 'B2-2026-11-25',
                display_date: '25/11',
                opening_date: new Date('2026-11-25T19:30:00Z'),
                schedule_time: 'Tối 2-4-6 (19:30 - 21:30)',
                max_seats: 15,
                enrolled_seats: 0,
                status: BatchStatus.OPEN,
                is_hot: false,
                order_num: 5,
              },
            ],
          },
        },
        include: {
          batches: {
            orderBy: { order_num: 'asc' },
          },
        },
      });
    }

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        targetBand: course.target_band,
        format: course.format,
        originalPrice: course.original_price,
        salePrice: course.sale_price,
        discountPercent: course.discount_percent,
        maxStudents: course.max_students,
        features: course.features,
      },
      batches: course.batches.map((b) => ({
        id: b.id,
        batchCode: b.batch_code,
        dateStr: b.display_date,
        openingDate: b.opening_date,
        scheduleTime: b.schedule_time,
        maxSeats: b.max_seats,
        enrolledSeats: b.enrolled_seats,
        seatsLeft: Math.max(0, b.max_seats - b.enrolled_seats),
        status: b.status,
        isHot: b.is_hot,
      })),
    };
  }

  /**
   * Tiếp nhận đăng ký tư vấn xếp lớp & giữ chỗ ưu đãi 35%
   */
  async registerLead(input: RegisterLeadInput, userId?: string) {
    // Tìm khóa học theo ID hoặc mã
    let targetCourseId = input.courseId;
    if (!targetCourseId) {
      const course = await prisma.course.findFirst({
        where: { code: input.courseCode || 'APTIS_B2_FASTTRACK' },
      });
      if (course) targetCourseId = course.id;
    }

    if (!targetCourseId) {
      throw new Error('Không tìm thấy thông tin khóa học tương ứng');
    }

    // Tìm batch nếu có batchDateStr
    let targetBatchId = input.batchId;
    if (!targetBatchId && input.batchDateStr) {
      const batch = await prisma.courseBatch.findFirst({
        where: {
          course_id: targetCourseId,
          display_date: input.batchDateStr,
        },
      });
      if (batch) targetBatchId = batch.id;
    }

    const lead = await prisma.courseLeadRegistration.create({
      data: {
        course_id: targetCourseId,
        batch_id: targetBatchId || null,
        user_id: userId || null,
        full_name: input.fullName,
        phone_number: input.phoneNumber,
        email: input.email || null,
        target_band: input.targetBand || 'B2',
        note: input.note || null,
        status: LeadConsultationStatus.PENDING,
      },
      include: {
        course: { select: { title: true } },
        batch: { select: { display_date: true, batch_code: true } },
      },
    });

    return {
      registrationId: lead.id,
      fullName: lead.full_name,
      phoneNumber: lead.phone_number,
      courseTitle: lead.course.title,
      batchDate: lead.batch?.display_date || input.batchDateStr || 'Sắp tới',
      status: lead.status,
      message: 'Đăng ký giữ chỗ thành công! Chuyên viên tư vấn sẽ liên hệ bạn trong vòng 15 phút.',
    };
  }

  /**
   * Quản trị: Lấy danh sách leads kèm bộ lọc và phân trang
   */
  async getLeads(params: {
    page?: number;
    limit?: number;
    status?: LeadConsultationStatus;
    batchId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.batchId) where.batch_id = params.batchId;

    const [total, leads] = await Promise.all([
      prisma.courseLeadRegistration.count({ where }),
      prisma.courseLeadRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          course: { select: { title: true, code: true } },
          batch: { select: { display_date: true, batch_code: true } },
        },
      }),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Quản trị: Cập nhật trạng thái xử lý Lead (PENDING -> CONTACTED -> ENROLLED)
   */
  async updateLeadStatus(
    leadId: string,
    input: UpdateLeadStatusInput,
    adminId?: string,
    req?: Request
  ) {
    const lead = await prisma.courseLeadRegistration.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new Error('Không tìm thấy thông tin đăng ký tư vấn');

    const updated = await prisma.courseLeadRegistration.update({
      where: { id: leadId },
      data: {
        status: input.status,
        assigned_admin: input.assignedAdmin || lead.assigned_admin,
        note: input.note ? `${lead.note ? lead.note + ' | ' : ''}${input.note}` : lead.note,
      },
    });

    // Nếu chuyển sang ENROLLED, tự động tăng số lượng enrolled_seats của batch tương ứng
    if (input.status === LeadConsultationStatus.ENROLLED && lead.batch_id) {
      await prisma.courseBatch.update({
        where: { id: lead.batch_id },
        data: {
          enrolled_seats: { increment: 1 },
        },
      });
    }

    if (adminId && req) {
      await auditService.record(
        {
          req,
          action: AuditAction.USER_STATUS_CHANGE,
          entityType: 'CourseLeadRegistration',
          entityId: leadId,
          description: `Cập nhật trạng thái lead ${lead.full_name} (${lead.phone_number}) thành ${input.status}`,
          oldValue: { status: lead.status },
          newValue: { status: updated.status },
        }
      );
    }

    return updated;
  }
}

export const courseService = new CourseService();
