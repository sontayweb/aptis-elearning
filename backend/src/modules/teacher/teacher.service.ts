import { prisma } from '../../config/database';
import { SubmissionStatus, UserRole, AuditAction, NotificationType } from '@prisma/client';
import { GradeSubmissionInput, CreateClassroomInput } from './teacher.dto';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notification.service';
import { emailService } from '../email/email.service';

export class TeacherService {
  async getGradingQueue(teacherId: string) {
    return prisma.examSubmission.findMany({
      where: {
        status: SubmissionStatus.PENDING_EVALUATION,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            skill: true,
            duration_minutes: true,
          },
        },
      },
      orderBy: { submitted_at: 'asc' },
    });
  }

  async getSubmissionForGrading(submissionId: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        exam: {
          include: {
            parts: {
              orderBy: { part_number: 'asc' },
              include: {
                questions: {
                  orderBy: { question_number: 'asc' },
                },
              },
            },
          },
        },
        answers: true,
        ai_results: true,
      },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Bài làm không tồn tại' };
    }

    return submission;
  }

  async gradeSubmission(teacherId: string, submissionId: string, data: GradeSubmissionInput) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: { user: true, exam: true },
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Bài làm không tồn tại' };
    }

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });

    // Thực thi trong Prisma Transaction ATOMIC
    const updated = await prisma.$transaction(async (tx) => {
      // Cập nhật điểm từng câu nếu có
      if (data.answersFeedback && data.answersFeedback.length > 0) {
        for (const af of data.answersFeedback) {
          await tx.submissionAnswer.update({
            where: { id: af.answerId },
            data: {
              score: af.score,
              feedback: af.feedback || null,
            },
          });
        }
      }

      // Cập nhật điểm bài nộp và chuyển trạng thái GRADED
      return tx.examSubmission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.GRADED,
          total_score: data.totalScore,
          cefr_level: data.cefrLevel,
          teacher_feedback: data.teacherFeedback,
          graded_by_id: teacherId,
          graded_at: new Date(),
        },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          exam: { select: { id: true, title: true, skill: true } },
        },
      });
    });

    // Ghi Audit Log giáo viên hoàn thành chấm bài
    auditService.record({
      action: AuditAction.SUBMISSION_GRADE_TEACHER,
      entityType: 'SUBMISSION',
      entityId: submissionId,
      description: `Giảng viên ${teacher?.full_name || 'Giảng viên'} đã hoàn thành chấm bài "${submission.exam.title}" cho học viên ${submission.user.full_name} (${data.totalScore}/50 - CEFR ${data.cefrLevel})`,
      newValue: {
        totalScore: data.totalScore,
        cefrLevel: data.cefrLevel,
        teacherFeedback: data.teacherFeedback,
      },
      systemActor: {
        id: teacherId,
        name: teacher?.full_name || 'Giảng viên',
        email: teacher?.email || 'teacher@aptiskytich.vn',
        role: teacher?.role || 'TEACHER',
      },
    });

    // Gửi thông báo in-app cho học viên
    notificationService.createNotification({
      userId: submission.user_id,
      title: 'Bài thi đã có nhận xét từ giảng viên 📝',
      message: `Giảng viên ${teacher?.full_name || 'Giảng viên'} đã chấm xong bài thi "${submission.exam.title}". Điểm: ${data.totalScore}/50 (${data.cefrLevel}).`,
      type: NotificationType.EXAM_GRADED,
      link: '/history',
    }).catch(() => {});

    // Gửi email chi tiết kết quả cho học viên
    if (updated.user?.email) {
      emailService.sendExamGradedEmail(updated.user.email, {
        fullName: updated.user.full_name || 'Học viên',
        examTitle: updated.exam?.title || 'Bài thi Aptis',
        totalScore: data.totalScore,
        cefrLevel: data.cefrLevel,
        teacherName: teacher?.full_name || 'Giảng viên',
        teacherNotes: data.teacherFeedback || undefined,
        submissionId,
      }).catch((err) => {
        console.error(`[TeacherService] Lỗi gửi email kết quả chấm thi cho ${updated.user.email}:`, err);
      });
    }

    return updated;
  }

  async getStats(teacherId: string) {
    const [pendingCount, gradedByMeCount, totalGradedSystem] = await Promise.all([
      prisma.examSubmission.count({
        where: { status: SubmissionStatus.PENDING_EVALUATION },
      }),
      prisma.examSubmission.count({
        where: { graded_by_id: teacherId },
      }),
      prisma.examSubmission.count({
        where: { status: SubmissionStatus.GRADED },
      }),
    ]);

    return {
      pendingGradingCount: pendingCount,
      gradedByMeCount,
      totalGradedSystem,
    };
  }

  async createClassroom(teacherId: string, data: CreateClassroomInput) {
    // Sinh mã lớp duy nhất: CLS-XXXXX
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const classCode = `CLS-${randomCode}`;

    return prisma.classroom.create({
      data: {
        name: data.name,
        description: data.description,
        teacher_id: teacherId,
        class_code: classCode,
      },
    });
  }

  async getClassrooms(teacherId: string) {
    return prisma.classroom.findMany({
      where: { teacher_id: teacherId },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async joinClassroom(userId: string, classCode: string) {
    const classroom = await prisma.classroom.findUnique({
      where: { class_code: classCode.trim().toUpperCase() },
    });

    if (!classroom) {
      throw { statusCode: 404, message: 'Mã lớp học không tồn tại' };
    }

    const existingMember = await prisma.classroomMember.findUnique({
      where: {
        classroom_id_user_id: {
          classroom_id: classroom.id,
          user_id: userId,
        },
      },
    });

    if (existingMember) {
      throw { statusCode: 400, message: 'Bạn đã tham gia lớp học này rồi' };
    }

    return prisma.classroomMember.create({
      data: {
        classroom_id: classroom.id,
        user_id: userId,
      },
      include: { classroom: true },
    });
  }

  async getClassroomMembers(teacherId: string, classroomId: string) {
    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacher_id: teacherId },
    });

    if (!classroom) {
      throw { statusCode: 404, message: 'Lớp học không tồn tại hoặc bạn không có quyền' };
    }

    return prisma.classroomMember.findMany({
      where: { classroom_id: classroomId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            created_at: true,
            submissions: {
              take: 5,
              orderBy: { submitted_at: 'desc' },
              select: {
                id: true,
                total_score: true,
                cefr_level: true,
                status: true,
                submitted_at: true,
              },
            },
          },
        },
      },
    });
  }

  async getStudentClassrooms(userId: string) {
    const memberships = await prisma.classroomMember.findMany({
      where: { user_id: userId },
      include: {
        classroom: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });

    const teacherIds = memberships.map((m) => m.classroom.teacher_id);
    const teachers = await prisma.user.findMany({
      where: { id: { in: teacherIds } },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
      },
    });

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    return memberships.map((m) => ({
      membershipId: m.id,
      joinedAt: m.joined_at,
      classroom: {
        id: m.classroom.id,
        name: m.classroom.name,
        classCode: m.classroom.class_code,
        description: m.classroom.description,
        totalMembers: m.classroom._count.members,
        createdAt: m.classroom.created_at,
      },
      teacher: teacherMap.get(m.classroom.teacher_id) || {
        id: m.classroom.teacher_id,
        full_name: 'Giảng viên Aptis',
        email: '',
      },
    }));
  }
}

export const teacherService = new TeacherService();
