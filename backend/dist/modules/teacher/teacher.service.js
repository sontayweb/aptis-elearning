"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherService = exports.TeacherService = void 0;
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notifications/notification.service");
class TeacherService {
    async getGradingQueue(teacherId) {
        return database_1.prisma.examSubmission.findMany({
            where: {
                status: client_1.SubmissionStatus.PENDING_EVALUATION,
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
    async getSubmissionForGrading(submissionId) {
        const submission = await database_1.prisma.examSubmission.findUnique({
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
    async gradeSubmission(teacherId, submissionId, data) {
        const submission = await database_1.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: { user: true, exam: true },
        });
        if (!submission) {
            throw { statusCode: 404, message: 'Bài làm không tồn tại' };
        }
        const teacher = await database_1.prisma.user.findUnique({ where: { id: teacherId } });
        // Thực thi trong Prisma Transaction ATOMIC
        const updated = await database_1.prisma.$transaction(async (tx) => {
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
                    status: client_1.SubmissionStatus.GRADED,
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
        audit_service_1.auditService.record({
            action: client_1.AuditAction.SUBMISSION_GRADE_TEACHER,
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
        // Gửi thông báo cho học viên
        notification_service_1.notificationService.createNotification({
            userId: submission.user_id,
            title: 'Bài thi đã có nhận xét từ giảng viên 📝',
            message: `Giảng viên ${teacher?.full_name || 'Giảng viên'} đã chấm xong bài thi "${submission.exam.title}". Điểm: ${data.totalScore}/50 (${data.cefrLevel}).`,
            type: client_1.NotificationType.EXAM_GRADED,
            link: '/history',
        }).catch(() => { });
        return updated;
    }
    async getStats(teacherId) {
        const [pendingCount, gradedByMeCount, totalGradedSystem] = await Promise.all([
            database_1.prisma.examSubmission.count({
                where: { status: client_1.SubmissionStatus.PENDING_EVALUATION },
            }),
            database_1.prisma.examSubmission.count({
                where: { graded_by_id: teacherId },
            }),
            database_1.prisma.examSubmission.count({
                where: { status: client_1.SubmissionStatus.GRADED },
            }),
        ]);
        return {
            pendingGradingCount: pendingCount,
            gradedByMeCount,
            totalGradedSystem,
        };
    }
    async createClassroom(teacherId, data) {
        // Sinh mã lớp duy nhất: CLS-XXXXX
        const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const classCode = `CLS-${randomCode}`;
        return database_1.prisma.classroom.create({
            data: {
                name: data.name,
                description: data.description,
                teacher_id: teacherId,
                class_code: classCode,
            },
        });
    }
    async getClassrooms(teacherId) {
        return database_1.prisma.classroom.findMany({
            where: { teacher_id: teacherId },
            include: {
                _count: { select: { members: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async joinClassroom(userId, classCode) {
        const classroom = await database_1.prisma.classroom.findUnique({
            where: { class_code: classCode.trim().toUpperCase() },
        });
        if (!classroom) {
            throw { statusCode: 404, message: 'Mã lớp học không tồn tại' };
        }
        const existingMember = await database_1.prisma.classroomMember.findUnique({
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
        return database_1.prisma.classroomMember.create({
            data: {
                classroom_id: classroom.id,
                user_id: userId,
            },
            include: { classroom: true },
        });
    }
    async getClassroomMembers(teacherId, classroomId) {
        const classroom = await database_1.prisma.classroom.findFirst({
            where: { id: classroomId, teacher_id: teacherId },
        });
        if (!classroom) {
            throw { statusCode: 404, message: 'Lớp học không tồn tại hoặc bạn không có quyền' };
        }
        return database_1.prisma.classroomMember.findMany({
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
    async getStudentClassrooms(userId) {
        const memberships = await database_1.prisma.classroomMember.findMany({
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
        const teachers = await database_1.prisma.user.findMany({
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
exports.TeacherService = TeacherService;
exports.teacherService = new TeacherService();
