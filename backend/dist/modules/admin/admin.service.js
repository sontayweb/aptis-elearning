"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const database_1 = require("../../config/database");
const password_1 = require("../../utils/password");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const xlsx = __importStar(require("xlsx"));
class AdminService {
    async listUsers(filter) {
        const { role, search, page, limit } = filter;
        const skip = (page - 1) * limit;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { full_name: { contains: search, mode: 'insensitive' } },
                { phone_number: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    phone_number: true,
                    role: true,
                    is_active: true,
                    created_at: true,
                    _count: { select: { submissions: true } },
                    subscriptions: {
                        where: { is_active: true },
                        take: 1,
                        orderBy: { end_date: 'desc' },
                        include: {
                            plan: {
                                select: { name: true, code: true },
                            },
                        },
                    },
                },
            }),
            database_1.prisma.user.count({ where }),
        ]);
        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createUser(input, req) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (existing) {
            throw { statusCode: 409, message: 'Email đã tồn tại trong hệ thống' };
        }
        if (input.role === client_1.UserRole.SUPER_ADMIN && req?.user?.role !== 'SUPER_ADMIN') {
            throw { statusCode: 403, message: 'Chỉ Tổng quản trị (Super Admin) mới có quyền cấp vai trò Super Admin' };
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await database_1.prisma.user.create({
            data: {
                email: input.email.toLowerCase(),
                password_hash: passwordHash,
                full_name: input.fullName,
                role: input.role,
                phone_number: input.phoneNumber || null,
                target_band: input.targetBand || client_1.TargetBand.B2_TARGET,
                internal_notes: input.internalNotes || null,
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                target_band: true,
                internal_notes: true,
                is_active: true,
                created_at: true,
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.USER_CREATE,
            entityType: 'USER',
            entityId: user.id,
            description: `Khởi tạo tài khoản mới: ${user.full_name} (${user.email}) với vai trò ${user.role}`,
            newValue: { email: user.email, role: user.role, fullName: user.full_name },
        });
        return user;
    }
    async bulkImportUsers(buffer, req) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw { statusCode: 400, message: 'Tệp Excel không chứa sheet dữ liệu nào' };
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length < 2) {
            throw { statusCode: 400, message: 'Tệp Excel không có dòng dữ liệu học viên nào' };
        }
        const results = {
            totalRows: rows.length - 1,
            successCount: 0,
            errorCount: 0,
            createdUsers: [],
            errors: [],
        };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const defaultPassword = 'Aptis@2026';
        const defaultHash = await (0, password_1.hashPassword)(defaultPassword);
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[1])
                continue;
            const fullName = String(row[0] || '').trim();
            const email = String(row[1] || '').trim().toLowerCase();
            const phoneNumber = row[2] ? String(row[2]).trim() : null;
            const rawPassword = row[3] ? String(row[3]).trim() : defaultPassword;
            const roleStr = String(row[4] || 'STUDENT').trim().toUpperCase();
            const targetStr = String(row[5] || 'B2').trim().toUpperCase();
            const internalNotes = row[6] ? String(row[6]).trim() : null;
            if (!fullName) {
                results.errorCount++;
                results.errors.push({ row: i + 1, email, reason: 'Thiếu họ và tên học viên' });
                continue;
            }
            if (!emailRegex.test(email)) {
                results.errorCount++;
                results.errors.push({ row: i + 1, email, reason: 'Email không đúng định dạng chuẩn' });
                continue;
            }
            const role = roleStr === 'TEACHER'
                ? client_1.UserRole.TEACHER
                : roleStr === 'ADMIN'
                    ? client_1.UserRole.ADMIN
                    : client_1.UserRole.STUDENT;
            const targetBand = targetStr.includes('B1')
                ? client_1.TargetBand.B1_TARGET
                : targetStr.includes('C')
                    ? client_1.TargetBand.C_TARGET
                    : client_1.TargetBand.B2_TARGET;
            try {
                const existing = await database_1.prisma.user.findUnique({ where: { email } });
                if (existing) {
                    results.errorCount++;
                    results.errors.push({ row: i + 1, email, reason: 'Email đã tồn tại trên hệ thống' });
                    continue;
                }
                const passwordHash = rawPassword === defaultPassword ? defaultHash : await (0, password_1.hashPassword)(rawPassword);
                const newUser = await database_1.prisma.user.create({
                    data: {
                        email,
                        password_hash: passwordHash,
                        full_name: fullName,
                        phone_number: phoneNumber,
                        role,
                        target_band: targetBand,
                        internal_notes: internalNotes,
                        is_active: true,
                    },
                    select: {
                        id: true,
                        email: true,
                        full_name: true,
                        role: true,
                        target_band: true,
                        created_at: true,
                    },
                });
                results.successCount++;
                results.createdUsers.push(newUser);
            }
            catch (err) {
                results.errorCount++;
                results.errors.push({ row: i + 1, email, reason: err.message || 'Lỗi lưu trữ cơ sở dữ liệu' });
            }
        }
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.USER_CREATE,
            entityType: 'USER_BATCH',
            entityId: 'BULK_IMPORT',
            description: `Nhập học viên hàng loạt từ Excel: Thành công ${results.successCount}/${results.totalRows}, Thất bại: ${results.errorCount}`,
            newValue: { successCount: results.successCount, errorCount: results.errorCount },
        });
        return results;
    }
    async updateUserStatus(userId, isActive, req) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        if (user.role === 'SUPER_ADMIN' && req?.user?.role !== 'SUPER_ADMIN') {
            throw { statusCode: 403, message: 'Chỉ Tổng quản trị mới có quyền thay đổi trạng thái của tài khoản Super Admin' };
        }
        const updated = await database_1.prisma.user.update({
            where: { id: userId },
            data: { is_active: isActive },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.USER_STATUS_CHANGE,
            entityType: 'USER',
            entityId: userId,
            description: `Cập nhật trạng thái tài khoản ${user.full_name} (${user.email}) thành ${isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}`,
            oldValue: { is_active: user.is_active },
            newValue: { is_active: isActive },
        });
        return updated;
    }
    async createExam(input, req) {
        const exam = await database_1.prisma.exam.create({
            data: {
                title: input.title,
                description: input.description,
                skill: input.skill,
                duration_minutes: input.durationMinutes,
                is_pro: input.isPro,
                source: 'WEB',
                parts: {
                    create: input.parts.map((p) => ({
                        part_number: p.partNumber,
                        title: p.title,
                        instructions: p.instructions,
                        passage_text: p.passageText,
                        audio_url: p.audioUrl,
                        image_url: p.imageUrl,
                        questions: {
                            create: p.questions.map((q) => ({
                                question_number: q.questionNumber,
                                question_type: q.questionType,
                                prompt: q.prompt,
                                options: q.options || undefined,
                                correct_answer: q.correctAnswer,
                                explanation: q.explanation,
                                max_score: q.maxScore,
                            })),
                        },
                    })),
                },
            },
            include: {
                parts: {
                    include: { questions: true },
                },
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_CREATE,
            entityType: 'EXAM',
            entityId: exam.id,
            description: `Tạo đề thi mới: "${exam.title}" (Kỹ năng: ${exam.skill}, Thời lượng: ${exam.duration_minutes}p)`,
            newValue: { title: exam.title, skill: exam.skill, durationMinutes: exam.duration_minutes, isPro: exam.is_pro },
        });
        return exam;
    }
    async deleteExam(examId, req) {
        const exam = await database_1.prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) {
            throw { statusCode: 404, message: 'Đề thi không tồn tại' };
        }
        await database_1.prisma.exam.delete({ where: { id: examId } });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_DELETE,
            entityType: 'EXAM',
            entityId: examId,
            description: `Xóa đề thi khỏi hệ thống: "${exam.title}" (${exam.skill})`,
            oldValue: { title: exam.title, skill: exam.skill, durationMinutes: exam.duration_minutes },
        });
        return { success: true, message: 'Xóa đề thi thành công' };
    }
    async updateExam(examId, input, req) {
        const exam = await database_1.prisma.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw { statusCode: 404, message: 'Đề thi không tồn tại' };
        const updated = await database_1.prisma.exam.update({
            where: { id: examId },
            data: {
                ...(input.title !== undefined && { title: input.title }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.durationMinutes !== undefined && { duration_minutes: input.durationMinutes }),
                ...(input.isPro !== undefined && { is_pro: input.isPro }),
                ...(input.isPublished !== undefined && { is_published: input.isPublished }),
                ...(input.skill !== undefined && { skill: input.skill }),
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_UPDATE,
            entityType: 'EXAM',
            entityId: examId,
            description: `Cập nhật cấu hình đề thi: "${updated.title}"`,
            newValue: input,
        });
        return updated;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Get full exam with all parts & questions
    // ──────────────────────────────────────────────────────────────
    async getExamFull(examId) {
        const exam = await database_1.prisma.exam.findUnique({
            where: { id: examId },
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
        });
        if (!exam)
            throw { statusCode: 404, message: 'Đề thi không tồn tại' };
        return exam;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Update a Part (passage, audio, image, instructions)
    // ──────────────────────────────────────────────────────────────
    async updatePart(partId, input, req) {
        const part = await database_1.prisma.examPart.findUnique({ where: { id: partId } });
        if (!part)
            throw { statusCode: 404, message: 'Phần thi không tồn tại' };
        const updated = await database_1.prisma.examPart.update({
            where: { id: partId },
            data: {
                ...(input.title !== undefined && { title: input.title }),
                ...(input.instructions !== undefined && { instructions: input.instructions }),
                ...(input.passageText !== undefined && { passage_text: input.passageText }),
                ...(input.audioUrl !== undefined && { audio_url: input.audioUrl }),
                ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_UPDATE,
            entityType: 'EXAM_PART',
            entityId: partId,
            description: `Cập nhật nội dung phần thi #${updated.part_number}: "${updated.title}"`,
            newValue: input,
        });
        return updated;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Add a new Part to an exam
    // ──────────────────────────────────────────────────────────────
    async addPart(examId, input, req) {
        const exam = await database_1.prisma.exam.findUnique({ where: { id: examId } });
        if (!exam)
            throw { statusCode: 404, message: 'Đề thi không tồn tại' };
        const maxPart = await database_1.prisma.examPart.findFirst({
            where: { exam_id: examId },
            orderBy: { part_number: 'desc' },
        });
        const newPartNumber = (maxPart?.part_number || 0) + 1;
        const part = await database_1.prisma.examPart.create({
            data: {
                exam_id: examId,
                part_number: input.partNumber || newPartNumber,
                title: input.title || `Part ${newPartNumber}`,
                instructions: input.instructions || null,
                passage_text: input.passageText || null,
                audio_url: input.audioUrl || null,
                image_url: input.imageUrl || null,
            },
            include: { questions: true },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_UPDATE,
            entityType: 'EXAM_PART',
            entityId: part.id,
            description: `Thêm phần thi mới #${part.part_number} vào đề "${exam.title}"`,
            newValue: { examId, partNumber: part.part_number, title: part.title },
        });
        return part;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Delete a Part (cascade deletes its questions)
    // ──────────────────────────────────────────────────────────────
    async deletePart(partId, req) {
        const part = await database_1.prisma.examPart.findUnique({
            where: { id: partId },
            include: { _count: { select: { questions: true } } },
        });
        if (!part)
            throw { statusCode: 404, message: 'Phần thi không tồn tại' };
        await database_1.prisma.examPart.delete({ where: { id: partId } });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_DELETE,
            entityType: 'EXAM_PART',
            entityId: partId,
            description: `Xóa phần thi #${part.part_number} (${part._count.questions} câu hỏi bị xóa theo)`,
            oldValue: { partId, title: part.title, questionCount: part._count.questions },
        });
        return { success: true };
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Update a single Question
    // ──────────────────────────────────────────────────────────────
    async updateQuestion(questionId, input, req) {
        const question = await database_1.prisma.question.findUnique({ where: { id: questionId } });
        if (!question)
            throw { statusCode: 404, message: 'Câu hỏi không tồn tại' };
        const updated = await database_1.prisma.question.update({
            where: { id: questionId },
            data: {
                ...(input.prompt !== undefined && { prompt: input.prompt }),
                ...(input.questionType !== undefined && { question_type: input.questionType }),
                ...(input.options !== undefined && { options: input.options }),
                ...(input.correctAnswer !== undefined && { correct_answer: input.correctAnswer }),
                ...(input.explanation !== undefined && { explanation: input.explanation }),
                ...(input.maxScore !== undefined && { max_score: Number(input.maxScore) }),
                ...(input.questionNumber !== undefined && { question_number: Number(input.questionNumber) }),
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_UPDATE,
            entityType: 'QUESTION',
            entityId: questionId,
            description: `Cập nhật câu hỏi #${updated.question_number}: "${(updated.prompt || '').slice(0, 50)}..."`,
            newValue: input,
        });
        return updated;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Add a Question to a Part
    // ──────────────────────────────────────────────────────────────
    async addQuestion(partId, input, req) {
        const part = await database_1.prisma.examPart.findUnique({ where: { id: partId } });
        if (!part)
            throw { statusCode: 404, message: 'Phần thi không tồn tại' };
        const maxQ = await database_1.prisma.question.findFirst({
            where: { part_id: partId },
            orderBy: { question_number: 'desc' },
        });
        const nextNum = input.questionNumber || (maxQ?.question_number || 0) + 1;
        const question = await database_1.prisma.question.create({
            data: {
                part_id: partId,
                question_number: nextNum,
                question_type: input.questionType || 'MULTIPLE_CHOICE',
                prompt: input.prompt || '',
                options: input.options || undefined,
                correct_answer: input.correctAnswer || null,
                explanation: input.explanation || null,
                max_score: Number(input.maxScore || 1.0),
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_UPDATE,
            entityType: 'QUESTION',
            entityId: question.id,
            description: `Thêm câu hỏi #${question.question_number} vào Part #${part.part_number}`,
            newValue: { partId, questionNumber: question.question_number },
        });
        return question;
    }
    // ──────────────────────────────────────────────────────────────
    // CONTENT EDITOR: Delete a Question
    // ──────────────────────────────────────────────────────────────
    async deleteQuestion(questionId, req) {
        const question = await database_1.prisma.question.findUnique({ where: { id: questionId } });
        if (!question)
            throw { statusCode: 404, message: 'Câu hỏi không tồn tại' };
        await database_1.prisma.question.delete({ where: { id: questionId } });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_DELETE,
            entityType: 'QUESTION',
            entityId: questionId,
            description: `Xóa câu hỏi #${question.question_number}: "${(question.prompt || '').slice(0, 40)}..."`,
            oldValue: { questionId, prompt: question.prompt, questionNumber: question.question_number },
        });
        return { success: true };
    }
    async duplicateExam(examId, req) {
        const sourceExam = await database_1.prisma.exam.findUnique({
            where: { id: examId },
            include: {
                parts: {
                    include: { questions: true },
                },
            },
        });
        if (!sourceExam)
            throw { statusCode: 404, message: 'Đề thi gốc không tồn tại' };
        const cloned = await database_1.prisma.exam.create({
            data: {
                title: `${sourceExam.title} (Bản sao)`,
                description: sourceExam.description,
                skill: sourceExam.skill,
                duration_minutes: sourceExam.duration_minutes,
                is_pro: sourceExam.is_pro,
                is_published: false,
                parts: {
                    create: sourceExam.parts.map((p) => ({
                        part_number: p.part_number,
                        title: p.title,
                        instructions: p.instructions,
                        passage_text: p.passage_text,
                        audio_url: p.audio_url,
                        image_url: p.image_url,
                        questions: {
                            create: p.questions.map((q) => ({
                                question_number: q.question_number,
                                question_type: q.question_type,
                                prompt: q.prompt,
                                options: q.options || undefined,
                                correct_answer: q.correct_answer,
                                explanation: q.explanation,
                                max_score: q.max_score,
                            })),
                        },
                    })),
                },
            },
            include: {
                parts: {
                    include: { questions: true },
                },
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.EXAM_CREATE,
            entityType: 'EXAM',
            entityId: cloned.id,
            description: `Nhân bản đề thi từ "${sourceExam.title}" thành "${cloned.title}"`,
            newValue: { title: cloned.title, skill: cloned.skill },
        });
        return cloned;
    }
    async listTransactions(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [transactions, total] = await Promise.all([
            database_1.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { id: true, full_name: true, email: true },
                    },
                },
            }),
            database_1.prisma.transaction.count({ where }),
        ]);
        return {
            transactions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async resolveTransaction(transactionId, input, req) {
        const txRecord = await database_1.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true },
        });
        if (!txRecord) {
            throw { statusCode: 404, message: 'Giao dịch không tồn tại' };
        }
        const targetUserId = input.targetUserId || txRecord.user_id;
        const targetUser = input.targetUserId
            ? await database_1.prisma.user.findUnique({ where: { id: input.targetUserId } })
            : txRecord.user;
        // Thực thi trong Prisma Transaction ATOMIC
        const updated = await database_1.prisma.$transaction(async (tx) => {
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    user_id: targetUserId,
                    status: input.status,
                    paid_at: input.status === client_1.TransactionStatus.COMPLETED ? new Date() : txRecord.paid_at,
                },
            });
            // Nếu duyệt thành công (COMPLETED), kích hoạt hoặc gia hạn gói VIP cộng dồn cho học viên
            if (input.status === client_1.TransactionStatus.COMPLETED) {
                const defaultPlan = (await tx.subscriptionPlan.findFirst({
                    where: { is_active: true, price_vnd: { lte: txRecord.amount } },
                    orderBy: { price_vnd: 'desc' },
                })) ||
                    (await tx.subscriptionPlan.findFirst({
                        where: { is_active: true },
                        orderBy: { price_vnd: 'asc' },
                    }));
                if (defaultPlan) {
                    const now = new Date();
                    const durationMs = defaultPlan.duration_days * 24 * 60 * 60 * 1000;
                    // Kiểm tra xem học viên đã có subscription active hay chưa để cộng dồn
                    const existingSub = await tx.userSubscription.findFirst({
                        where: {
                            user_id: targetUserId,
                            is_active: true,
                            end_date: { gt: now },
                        },
                        orderBy: { end_date: 'desc' },
                    });
                    if (existingSub) {
                        const newEndDate = new Date(existingSub.end_date.getTime() + durationMs);
                        await tx.userSubscription.update({
                            where: { id: existingSub.id },
                            data: {
                                plan_id: defaultPlan.id,
                                end_date: newEndDate,
                                ai_quota_left: existingSub.ai_quota_left + defaultPlan.ai_quota,
                                teacher_quota_left: existingSub.teacher_quota_left + defaultPlan.teacher_quota,
                                transaction_id: txRecord.id,
                            },
                        });
                    }
                    else {
                        const endDate = new Date(now.getTime() + durationMs);
                        await tx.userSubscription.create({
                            data: {
                                user_id: targetUserId,
                                plan_id: defaultPlan.id,
                                start_date: now,
                                end_date: endDate,
                                is_active: true,
                                ai_quota_left: defaultPlan.ai_quota,
                                teacher_quota_left: defaultPlan.teacher_quota,
                                transaction_id: txRecord.id,
                            },
                        });
                    }
                }
            }
            return updatedTx;
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.PAYMENT_MANUAL_RESOLVE,
            entityType: 'TRANSACTION',
            entityId: transactionId,
            description: `Khớp lệnh thủ công đơn hàng ${txRecord.order_code} (${txRecord.amount.toLocaleString('vi-VN')}đ) cho học viên ${targetUser?.full_name || txRecord.user.full_name} sang ${input.status}`,
            oldValue: { status: txRecord.status, userId: txRecord.user_id },
            newValue: { status: input.status, note: input.note, userId: targetUserId },
        });
        return updated;
    }
    async createManualTransaction(input, req) {
        const user = await database_1.prisma.user.findUnique({ where: { id: input.userId } });
        if (!user) {
            throw { statusCode: 404, message: 'Học viên không tồn tại' };
        }
        const orderCode = `OFFLINE_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        let plan = null;
        if (input.planId) {
            plan = await database_1.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
        }
        if (!plan) {
            plan =
                (await database_1.prisma.subscriptionPlan.findFirst({
                    where: { is_active: true, price_vnd: { lte: input.amount } },
                    orderBy: { price_vnd: 'desc' },
                })) ||
                    (await database_1.prisma.subscriptionPlan.findFirst({
                        where: { is_active: true },
                        orderBy: { price_vnd: 'asc' },
                    }));
        }
        const result = await database_1.prisma.$transaction(async (tx) => {
            const newTx = await tx.transaction.create({
                data: {
                    user_id: input.userId,
                    order_code: orderCode,
                    amount: input.amount,
                    status: client_1.TransactionStatus.COMPLETED,
                    payment_method: input.paymentMethod || 'MANUAL_BANK_TRANSFER',
                    bank_name: 'Direct / Offline Transfer',
                    paid_at: new Date(),
                },
            });
            if (plan) {
                const now = new Date();
                const durationMs = plan.duration_days * 24 * 60 * 60 * 1000;
                const existingSub = await tx.userSubscription.findFirst({
                    where: {
                        user_id: input.userId,
                        is_active: true,
                        end_date: { gt: now },
                    },
                    orderBy: { end_date: 'desc' },
                });
                if (existingSub) {
                    const newEndDate = new Date(existingSub.end_date.getTime() + durationMs);
                    await tx.userSubscription.update({
                        where: { id: existingSub.id },
                        data: {
                            plan_id: plan.id,
                            end_date: newEndDate,
                            ai_quota_left: existingSub.ai_quota_left + plan.ai_quota,
                            teacher_quota_left: existingSub.teacher_quota_left + plan.teacher_quota,
                            transaction_id: newTx.id,
                        },
                    });
                }
                else {
                    const endDate = new Date(now.getTime() + durationMs);
                    await tx.userSubscription.create({
                        data: {
                            user_id: input.userId,
                            plan_id: plan.id,
                            start_date: now,
                            end_date: endDate,
                            is_active: true,
                            ai_quota_left: plan.ai_quota,
                            teacher_quota_left: plan.teacher_quota,
                            transaction_id: newTx.id,
                        },
                    });
                }
            }
            return newTx;
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.PAYMENT_MANUAL_RESOLVE,
            entityType: 'TRANSACTION',
            entityId: result.id,
            description: `Tạo giao dịch nạp tiền thủ công ${orderCode} (${input.amount.toLocaleString('vi-VN')}đ) cho học viên ${user.full_name}: ${input.note || 'Khớp lệnh học vụ'}`,
            newValue: { orderCode, amount: input.amount, userId: input.userId, note: input.note },
        });
        return result;
    }
    async grantVip(userId, input, req) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        let plan = null;
        if (input.planId) {
            plan = await database_1.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
        }
        if (!plan) {
            plan = await database_1.prisma.subscriptionPlan.findFirst({
                where: { is_active: true },
                orderBy: { duration_days: 'asc' },
            });
        }
        if (!plan) {
            // Fallback an toàn nếu chưa có plan nào
            plan = await database_1.prisma.subscriptionPlan.findFirst();
        }
        if (!plan) {
            throw { statusCode: 500, message: 'Hệ thống chưa thiết lập gói cước nào' };
        }
        const days = input.days || plan.duration_days || 30;
        const now = new Date();
        const durationMs = days * 24 * 60 * 60 * 1000;
        // Kiểm tra subscription hiện tại còn hạn để cộng dồn
        const existingSub = await database_1.prisma.userSubscription.findFirst({
            where: {
                user_id: userId,
                is_active: true,
                end_date: { gt: now },
            },
            orderBy: { end_date: 'desc' },
        });
        let subscription;
        let newEndDate;
        if (existingSub) {
            newEndDate = new Date(existingSub.end_date.getTime() + durationMs);
            subscription = await database_1.prisma.userSubscription.update({
                where: { id: existingSub.id },
                data: {
                    plan_id: plan.id,
                    end_date: newEndDate,
                    ai_quota_left: existingSub.ai_quota_left + (plan.ai_quota || 50),
                    teacher_quota_left: existingSub.teacher_quota_left + (plan.teacher_quota || 5),
                },
                include: { plan: true },
            });
        }
        else {
            newEndDate = new Date(now.getTime() + durationMs);
            subscription = await database_1.prisma.userSubscription.create({
                data: {
                    user_id: userId,
                    plan_id: plan.id,
                    start_date: now,
                    end_date: newEndDate,
                    is_active: true,
                    ai_quota_left: plan.ai_quota || 50,
                    teacher_quota_left: plan.teacher_quota || 5,
                },
                include: { plan: true },
            });
        }
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.USER_ROLE_CHANGE,
            entityType: 'USER',
            entityId: userId,
            description: `Cấp/Gia hạn VIP ${days} ngày cho học viên ${user.full_name} (${user.email}). Lý do: ${input.reason || 'Học vụ kích hoạt'}`,
            newValue: { days, planName: plan.name, reason: input.reason, endDate: newEndDate },
        });
        return subscription;
    }
    async resetPassword(userId, input, req) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        if (user.role === 'SUPER_ADMIN' && req?.user?.role !== 'SUPER_ADMIN') {
            throw { statusCode: 403, message: 'Chỉ Tổng quản trị mới có quyền đặt lại mật khẩu của tài khoản Super Admin' };
        }
        const newPassword = input.newPassword || 'Aptis123';
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { password_hash: passwordHash },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.AUTH_PASSWORD_RESET,
            entityType: 'USER',
            entityId: userId,
            description: `Đặt lại mật khẩu cho tài khoản ${user.full_name} (${user.email}) thành ${newPassword}`,
        });
        return {
            success: true,
            message: `Đã đặt lại mật khẩu cho ${user.full_name} thành công!`,
            newPassword,
        };
    }
    async adjustQuota(userId, input, req) {
        const sub = await database_1.prisma.userSubscription.findFirst({
            where: { user_id: userId, is_active: true },
            orderBy: { end_date: 'desc' },
        });
        if (!sub) {
            throw {
                statusCode: 400,
                message: 'Học viên chưa có gói VIP hoạt động. Vui lòng kích hoạt gói VIP trước khi cộng lượt chấm.',
            };
        }
        const updated = await database_1.prisma.userSubscription.update({
            where: { id: sub.id },
            data: {
                ai_quota_left: { increment: input.aiQuota },
                teacher_quota_left: input.teacherQuota ? { increment: input.teacherQuota } : undefined,
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.PLAN_UPDATE,
            entityType: 'SUBSCRIPTION',
            entityId: sub.id,
            description: `Cộng thêm ${input.aiQuota} lượt chấm AI cho học viên. Lý do: ${input.reason || 'Học vụ hỗ trợ'}`,
            newValue: { addedAiQuota: input.aiQuota, currentAiQuota: updated.ai_quota_left },
        });
        return updated;
    }
    async getUserSummary(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                role: true,
                is_active: true,
                created_at: true,
                subscriptions: {
                    where: { is_active: true },
                    orderBy: { end_date: 'desc' },
                    include: { plan: true },
                },
                submissions: {
                    orderBy: { started_at: 'desc' },
                    take: 5,
                    include: { exam: { select: { title: true, skill: true } } },
                },
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 5,
                },
                _count: {
                    select: {
                        submissions: true,
                        transactions: true,
                    },
                },
            },
        });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        return user;
    }
    async listExams(page = 1, limit = 50, skill) {
        const skip = (page - 1) * limit;
        const where = {};
        if (skill && skill !== 'ALL') {
            where.skill = skill;
        }
        const [exams, total] = await Promise.all([
            database_1.prisma.exam.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    parts: {
                        include: {
                            _count: { select: { questions: true } },
                        },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
            }),
            database_1.prisma.exam.count({ where }),
        ]);
        const formatted = exams.map((exam) => {
            const totalQuestions = exam.parts.reduce((sum, p) => sum + p._count.questions, 0);
            return {
                id: exam.id,
                title: exam.title,
                description: exam.description,
                skill: exam.skill,
                durationMinutes: exam.duration_minutes,
                isPro: exam.is_pro,
                isPublished: exam.is_published,
                source: exam.source,
                createdAt: exam.created_at,
                partsCount: exam.parts.length,
                questionsCount: totalQuestions,
                attemptsCount: exam._count.submissions,
            };
        });
        return {
            exams: formatted,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async listPlans() {
        const plans = await database_1.prisma.subscriptionPlan.findMany({
            orderBy: { price_vnd: 'asc' },
            include: {
                _count: {
                    select: {
                        subscriptions: {
                            where: { is_active: true },
                        },
                    },
                },
            },
        });
        return plans.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            priceVnd: p.price_vnd,
            durationDays: p.duration_days,
            aiQuota: p.ai_quota,
            teacherQuota: p.teacher_quota,
            isActive: p.is_active,
            features: p.features,
            activeSubscribers: p._count.subscriptions,
            createdAt: p.created_at,
        }));
    }
    async updatePlan(planId, input, req) {
        const plan = await database_1.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw { statusCode: 404, message: 'Gói cước không tồn tại' };
        }
        const updated = await database_1.prisma.subscriptionPlan.update({
            where: { id: planId },
            data: {
                ...(input.price_vnd !== undefined && { price_vnd: input.price_vnd }),
                ...(input.ai_quota !== undefined && { ai_quota: input.ai_quota }),
                ...(input.teacher_quota !== undefined && { teacher_quota: input.teacher_quota }),
                ...(input.is_active !== undefined && { is_active: input.is_active }),
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.PLAN_UPDATE,
            entityType: 'PLAN',
            entityId: planId,
            description: `Cập nhật cấu hình gói cước ${plan.name} (${plan.code})`,
            oldValue: { price_vnd: plan.price_vnd, ai_quota: plan.ai_quota, teacher_quota: plan.teacher_quota, is_active: plan.is_active },
            newValue: input,
        });
        return updated;
    }
    async getDashboardKPIs(filter) {
        const now = new Date();
        const period = filter?.period || 'week';
        // Xác định rangeStart và rangeEnd theo Múi giờ Việt Nam
        let rangeStart = new Date(now);
        let rangeEnd = new Date(now);
        let periodLabel = '7 ngày qua';
        if (period === 'today') {
            periodLabel = 'Hôm nay';
            rangeStart.setHours(0, 0, 0, 0);
            rangeEnd.setHours(23, 59, 59, 999);
        }
        else if (period === 'week') {
            periodLabel = 'Tuần này (7 ngày)';
            rangeStart.setDate(now.getDate() - 6);
            rangeStart.setHours(0, 0, 0, 0);
            rangeEnd.setHours(23, 59, 59, 999);
        }
        else if (period === 'month') {
            periodLabel = 'Tháng này (30 ngày)';
            rangeStart.setDate(now.getDate() - 29);
            rangeStart.setHours(0, 0, 0, 0);
            rangeEnd.setHours(23, 59, 59, 999);
        }
        else if (period === 'year') {
            periodLabel = `Năm ${now.getFullYear()}`;
            rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
        else if (period === 'custom' && filter?.fromDate && filter?.toDate) {
            const [fy, fm, fd] = filter.fromDate.split('-').map(Number);
            const [ty, tm, td] = filter.toDate.split('-').map(Number);
            rangeStart = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
            rangeEnd = new Date(ty, tm - 1, td, 23, 59, 59, 999);
            periodLabel = `${filter.fromDate} → ${filter.toDate}`;
        }
        else if (period === 'all') {
            periodLabel = 'Toàn bộ thời gian';
            rangeStart = new Date(2020, 0, 1);
            rangeEnd.setHours(23, 59, 59, 999);
        }
        else {
            // Default: 7 ngày qua
            rangeStart.setDate(now.getDate() - 6);
            rangeStart.setHours(0, 0, 0, 0);
            rangeEnd.setHours(23, 59, 59, 999);
        }
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const [totalExams, totalUsers, activeUsers, totalAttempts, todayAttempts, totalTransactions, pendingTransactionsCount, pendingGradingCount, pendingTransactions, 
        // Thống kê trong kỳ lọc
        periodRevenueRes, periodAttempts, periodCompletedAttempts, periodNewUsers, periodPaidTxCount, periodAvgScoreRes,] = await Promise.all([
            database_1.prisma.exam.count(),
            database_1.prisma.user.count(),
            database_1.prisma.user.count({ where: { is_active: true } }),
            database_1.prisma.examSubmission.count(),
            database_1.prisma.examSubmission.count({
                where: { started_at: { gte: startOfToday } },
            }),
            database_1.prisma.transaction.aggregate({
                where: { status: client_1.TransactionStatus.COMPLETED },
                _sum: { amount: true },
            }),
            database_1.prisma.transaction.count({
                where: { status: client_1.TransactionStatus.PENDING },
            }),
            database_1.prisma.examSubmission.count({
                where: { status: client_1.SubmissionStatus.PENDING_EVALUATION },
            }),
            database_1.prisma.transaction.findMany({
                where: { status: client_1.TransactionStatus.PENDING },
                take: 5,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { id: true, full_name: true, email: true, phone_number: true },
                    },
                },
            }),
            // Kỳ lọc
            database_1.prisma.transaction.aggregate({
                where: {
                    status: client_1.TransactionStatus.COMPLETED,
                    created_at: { gte: rangeStart, lte: rangeEnd },
                },
                _sum: { amount: true },
            }),
            database_1.prisma.examSubmission.count({
                where: { started_at: { gte: rangeStart, lte: rangeEnd } },
            }),
            database_1.prisma.examSubmission.count({
                where: {
                    started_at: { gte: rangeStart, lte: rangeEnd },
                    status: { in: [client_1.SubmissionStatus.SUBMITTED, client_1.SubmissionStatus.GRADED] },
                },
            }),
            database_1.prisma.user.count({
                where: { created_at: { gte: rangeStart, lte: rangeEnd } },
            }),
            database_1.prisma.transaction.count({
                where: {
                    status: client_1.TransactionStatus.COMPLETED,
                    created_at: { gte: rangeStart, lte: rangeEnd },
                },
            }),
            database_1.prisma.examSubmission.aggregate({
                where: {
                    started_at: { gte: rangeStart, lte: rangeEnd },
                    total_score: { not: null, gt: 0 },
                },
                _avg: { total_score: true },
            }),
        ]);
        // Xây dựng danh sách mốc thời gian động (Buckets) cho biểu đồ
        let buckets = [];
        if (period === 'today') {
            // 6 khung giờ trong ngày: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24
            const hours = [0, 4, 8, 12, 16, 20];
            buckets = hours.map((h) => {
                const bStart = new Date(rangeStart);
                bStart.setHours(h, 0, 0, 0);
                const bEnd = new Date(rangeStart);
                bEnd.setHours(h + 3, 59, 59, 999);
                return {
                    start: bStart,
                    end: bEnd,
                    label: `${String(h).padStart(2, '0')}:00`,
                    date: bStart.toISOString(),
                };
            });
        }
        else if (period === 'year') {
            // 12 tháng trong năm
            buckets = Array.from({ length: 12 }, (_, m) => {
                const bStart = new Date(now.getFullYear(), m, 1, 0, 0, 0, 0);
                const bEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
                return {
                    start: bStart,
                    end: bEnd,
                    label: `Th${m + 1}`,
                    date: `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-01`,
                };
            });
        }
        else {
            // Theo từng ngày (từ rangeStart đến rangeEnd, tối đa 31 ngày)
            const diffDays = Math.max(1, Math.min(31, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000))));
            buckets = Array.from({ length: diffDays }, (_, i) => {
                const d = new Date(rangeStart);
                d.setDate(rangeStart.getDate() + i);
                const bStart = new Date(d);
                bStart.setHours(0, 0, 0, 0);
                const bEnd = new Date(d);
                bEnd.setHours(23, 59, 59, 999);
                const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                return {
                    start: bStart,
                    end: bEnd,
                    label: dayStr,
                    date: d.toISOString().split('T')[0],
                };
            });
        }
        // Truy vấn dữ liệu biểu đồ song song theo buckets
        const [dailyAttempts, dailyRevenue] = await Promise.all([
            Promise.all(buckets.map(async (b) => {
                const count = await database_1.prisma.examSubmission.count({
                    where: {
                        started_at: { gte: b.start, lte: b.end },
                    },
                });
                return {
                    date: b.date,
                    label: b.label,
                    attempts: count,
                };
            })),
            Promise.all(buckets.map(async (b) => {
                const rev = await database_1.prisma.transaction.aggregate({
                    where: {
                        status: client_1.TransactionStatus.COMPLETED,
                        created_at: { gte: b.start, lte: b.end },
                    },
                    _sum: { amount: true },
                });
                return {
                    date: b.date,
                    label: b.label,
                    amount: rev._sum.amount || 0,
                };
            })),
        ]);
        // Thống kê phân bổ CEFR thật từ kết quả bài thi
        const [bandC, bandB2, bandB1, bandA, avgScoreRes, completedSubmissionsCount, skillStats, recentSubmissions, recentTransactions] = await Promise.all([
            database_1.prisma.examSubmission.count({
                where: {
                    OR: [{ cefr_level: 'C1' }, { cefr_level: 'C2' }, { total_score: { gte: 160 } }],
                },
            }),
            database_1.prisma.examSubmission.count({
                where: {
                    OR: [
                        { cefr_level: 'B2' },
                        { AND: [{ total_score: { gte: 120 } }, { total_score: { lt: 160 } }] },
                    ],
                },
            }),
            database_1.prisma.examSubmission.count({
                where: {
                    OR: [
                        { cefr_level: 'B1' },
                        { AND: [{ total_score: { gte: 80 } }, { total_score: { lt: 120 } }] },
                    ],
                },
            }),
            database_1.prisma.examSubmission.count({
                where: {
                    OR: [
                        { cefr_level: 'A2' },
                        { cefr_level: 'A1' },
                        { AND: [{ total_score: { gt: 0 } }, { total_score: { lt: 80 } }] },
                    ],
                },
            }),
            database_1.prisma.examSubmission.aggregate({
                where: { total_score: { not: null, gt: 0 } },
                _avg: { total_score: true },
            }),
            database_1.prisma.examSubmission.count({
                where: {
                    status: { in: [client_1.SubmissionStatus.SUBMITTED, client_1.SubmissionStatus.GRADED] },
                },
            }),
            database_1.prisma.exam.groupBy({
                by: ['skill'],
                _count: { id: true },
            }),
            database_1.prisma.examSubmission.findMany({
                take: 8,
                orderBy: { started_at: 'desc' },
                include: {
                    user: { select: { id: true, full_name: true, email: true } },
                    exam: { select: { id: true, title: true, skill: true } },
                },
            }),
            database_1.prisma.transaction.findMany({
                take: 8,
                orderBy: { created_at: 'desc' },
                include: {
                    user: { select: { id: true, full_name: true, email: true } },
                },
            }),
        ]);
        // Tổng hợp sự kiện hoạt động học viên thực tế
        const recentActivities = [];
        const nowMs = Date.now();
        const getRelativeTimeString = (date) => {
            const diffMs = nowMs - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            if (diffMin < 1)
                return 'Vừa xong';
            if (diffMin < 60)
                return `${diffMin} phút trước`;
            const diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24)
                return `${diffHours} giờ trước`;
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays} ngày trước`;
        };
        for (const sub of recentSubmissions) {
            const initials = sub.user?.full_name
                ? sub.user.full_name
                    .trim()
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : 'HV';
            const scoreText = sub.total_score != null ? ` — ${Math.round(sub.total_score)}/200 điểm` : '';
            const badge = sub.cefr_level ? `Band ${sub.cefr_level}` : sub.status === 'SUBMITTED' ? 'Đã nộp' : 'Đang thi';
            recentActivities.push({
                id: `sub_${sub.id}`,
                user: sub.user?.full_name || 'Học viên ẩn danh',
                avatar: initials,
                action: sub.status === 'IN_PROGRESS' ? 'Bắt đầu làm bài thi' : 'Đã hoàn thành bài thi',
                detail: `${sub.exam?.title || 'Bài thi Aptis'}${scoreText}`,
                time: getRelativeTimeString(sub.started_at),
                type: 'exam',
                badge,
                badgeColor: sub.cefr_level?.startsWith('C')
                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                    : sub.cefr_level?.startsWith('B')
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
                createdAt: sub.started_at.toISOString(),
            });
        }
        for (const tx of recentTransactions) {
            const initials = tx.user?.full_name
                ? tx.user.full_name
                    .trim()
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : 'HV';
            recentActivities.push({
                id: `tx_${tx.id}`,
                user: tx.user?.full_name || 'Học viên nạp tiền',
                avatar: initials,
                action: tx.status === 'COMPLETED' ? 'Thanh toán thành công' : 'Đơn hàng mới tạo',
                detail: `Đơn ${tx.order_code} qua ${tx.bank_name || tx.payment_method}`,
                time: getRelativeTimeString(tx.created_at),
                type: 'payment',
                badge: `+${tx.amount.toLocaleString('vi-VN')} đ`,
                badgeColor: tx.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                createdAt: tx.created_at.toISOString(),
            });
        }
        recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalGraded = bandC + bandB2 + bandB1 + bandA || 1;
        const bandDistribution = [
            {
                band: 'Band C (C1 - C2)',
                percent: Math.round((bandC / totalGraded) * 100),
                count: bandC,
                color: 'bg-purple-500',
                desc: 'Xuất sắc & Thành thạo',
            },
            {
                band: 'Band B2',
                percent: Math.round((bandB2 / totalGraded) * 100),
                count: bandB2,
                color: 'bg-emerald-500',
                desc: 'Chuẩn đầu ra Đại học & Du học',
            },
            {
                band: 'Band B1',
                percent: Math.round((bandB1 / totalGraded) * 100),
                count: bandB1,
                color: 'bg-blue-500',
                desc: 'Nền tảng giao tiếp chuẩn CEFR',
            },
            {
                band: 'Band A2 / Cần cải thiện',
                percent: Math.round((bandA / totalGraded) * 100),
                count: bandA,
                color: 'bg-amber-500',
                desc: 'Cần củng cố thêm từ vựng & ngữ pháp',
            },
        ];
        const skillCounts = {
            FULL_TEST: 0,
            LISTENING: 0,
            READING: 0,
            WRITING: 0,
            SPEAKING: 0,
        };
        for (const s of skillStats) {
            skillCounts[s.skill] = s._count.id;
        }
        const completionRate = totalAttempts > 0 ? Math.round((completedSubmissionsCount / totalAttempts) * 100) : 100;
        const averageScore = avgScoreRes._avg.total_score ? Math.round(avgScoreRes._avg.total_score) : 145;
        const periodRevenueVND = periodRevenueRes._sum.amount || 0;
        const avgOrderValue = periodPaidTxCount > 0 ? Math.round(periodRevenueVND / periodPaidTxCount) : 0;
        const periodAvgScore = periodAvgScoreRes._avg.total_score ? Math.round(periodAvgScoreRes._avg.total_score) : 0;
        const periodCompletionRate = periodAttempts > 0 ? Math.round((periodCompletedAttempts / periodAttempts) * 100) : 100;
        return {
            // Chỉ số tổng lũy kế
            totalExams,
            totalUsers,
            activeUsers,
            totalAttempts,
            todayAttempts,
            totalRevenueVND: totalTransactions._sum.amount || 0,
            pendingTransactionsCount,
            pendingGradingCount,
            pendingTransactions,
            // Biểu đồ theo kỳ lọc
            dailyAttempts,
            dailyRevenue,
            bandDistribution,
            skillCounts,
            recentActivities,
            averageScore,
            completionRate,
            // Chỉ số trong kỳ lọc được chọn
            periodStats: {
                period,
                label: periodLabel,
                rangeStart: rangeStart.toISOString(),
                rangeEnd: rangeEnd.toISOString(),
                revenueVND: periodRevenueVND,
                attempts: periodAttempts,
                completedAttempts: periodCompletedAttempts,
                completionRate: periodCompletionRate,
                newUsers: periodNewUsers,
                paidTransactionsCount: periodPaidTxCount,
                avgOrderValue,
                avgScore: periodAvgScore,
            },
        };
    }
    async exportDashboardReport(filter) {
        const kpis = await this.getDashboardKPIs(filter);
        const p = kpis.periodStats;
        // Tạo nội dung CSV chuẩn UTF-8 kèm BOM
        const lines = [];
        lines.push('\uFEFF"BÁO CÁO THỐNG KÊ VẬN HÀNH & KINH DOANH APTIS ESOL PREMIER"');
        lines.push(`"Thời điểm xuất báo cáo:","${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}"`);
        lines.push(`"Kỳ báo cáo:","${p.label}"`);
        lines.push(`"Khoảng thời gian:","${p.rangeStart} đến ${p.rangeEnd}"`);
        lines.push('');
        // Bảng 1: KPI Trong kỳ
        lines.push('"--- 1. CÁC CHỈ SỐ HOẠT ĐỘNG CHÍNH TRONG KỲ ---"');
        lines.push('"Chỉ số","Giá trị","Đơn vị"');
        lines.push(`"Doanh thu trong kỳ","${p.revenueVND.toLocaleString('vi-VN')}","VNĐ"`);
        lines.push(`"Số đơn hàng thành công","${p.paidTransactionsCount}","Đơn"`);
        lines.push(`"Giá trị đơn hàng trung bình (AOV)","${p.avgOrderValue.toLocaleString('vi-VN')}","VNĐ/đơn"`);
        lines.push(`"Lượt thi trong kỳ","${p.attempts}","Lượt"`);
        lines.push(`"Lượt thi hoàn thành","${p.completedAttempts}","Lượt (${p.completionRate}%)"`);
        lines.push(`"Học viên đăng ký mới","${p.newUsers}","Học viên"`);
        lines.push(`"Điểm thi trung bình trong kỳ","${p.avgScore}","Điểm"`);
        lines.push('');
        // Bảng 2: Tổng lũy kế toàn hệ thống
        lines.push('"--- 2. CHỈ SỐ TỔNG QUAN TOÀN HỆ THỐNG (LŨY KẾ) ---"');
        lines.push('"Chỉ số","Giá trị"');
        lines.push(`"Tổng người dùng đăng ký","${kpis.totalUsers}"`);
        lines.push(`"Người dùng đang hoạt động","${kpis.activeUsers}"`);
        lines.push(`"Tổng số bộ đề thi","${kpis.totalExams}"`);
        lines.push(`"Tổng lượt thi lũy kế","${kpis.totalAttempts}"`);
        lines.push(`"Tổng doanh thu tích lũy","${kpis.totalRevenueVND.toLocaleString('vi-VN')} VNĐ"`);
        lines.push(`"Giao dịch SePay chờ duyệt","${kpis.pendingTransactionsCount}"`);
        lines.push(`"Bài thi tự luận chờ chấm","${kpis.pendingGradingCount}"`);
        lines.push('');
        // Bảng 3: Diễn biến theo thời gian (Biểu đồ)
        lines.push('"--- 3. DIỄN BIẾN LƯỢT THI VÀ DOANH THU THEO THỜI GIAN ---"');
        lines.push('"Thời gian / Mốc","Số lượt thi","Doanh thu (VNĐ)"');
        kpis.dailyAttempts.forEach((item, idx) => {
            const rev = kpis.dailyRevenue[idx]?.amount || 0;
            lines.push(`"${item.label} (${item.date})","${item.attempts}","${rev.toLocaleString('vi-VN')}"`);
        });
        lines.push('');
        // Bảng 4: Phân bố Band điểm
        lines.push('"--- 4. PHÂN BỐ TRÌNH ĐỘ BAND CEFR CỦA HỌC VIÊN ---"');
        lines.push('"Trình độ Band","Tỷ lệ %","Số lượng","Mô tả chuẩn"');
        kpis.bandDistribution.forEach((b) => {
            lines.push(`"${b.band}","${b.percent}%","${b.count} bài","${b.desc}"`);
        });
        return lines.join('\r\n');
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
