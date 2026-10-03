import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/password';
import {
  AdminUserFilterInput,
  AdminCreateUserInput,
  AdminCreateExamInput,
  AdminResolveTransactionInput,
  AdminCreateManualTransactionInput,
  AdminGrantVipInput,
  AdminResetPasswordInput,
  AdminAdjustQuotaInput,
} from './admin.dto';
import { TransactionStatus, SubmissionStatus, AuditAction, TargetBand, UserRole } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { Request } from 'express';
import * as xlsx from 'xlsx';

export class AdminService {
  async listUsers(filter: AdminUserFilterInput) {
    const { role, search, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
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
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createUser(input: AdminCreateUserInput, req?: Request) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw { statusCode: 409, message: 'Email đã tồn tại trong hệ thống' };
    }

    if (input.role === UserRole.SUPER_ADMIN && (req as any)?.user?.role !== 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Chỉ Tổng quản trị (Super Admin) mới có quyền cấp vai trò Super Admin' };
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: input.fullName,
        role: input.role,
        phone_number: input.phoneNumber || null,
        target_band: input.targetBand || TargetBand.B2_TARGET,
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

    auditService.record({
      req,
      action: AuditAction.USER_CREATE,
      entityType: 'USER',
      entityId: user.id,
      description: `Khởi tạo tài khoản mới: ${user.full_name} (${user.email}) với vai trò ${user.role}`,
      newValue: { email: user.email, role: user.role, fullName: user.full_name },
    });

    return user;
  }

  async bulkImportUsers(buffer: Buffer, req?: Request) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw { statusCode: 400, message: 'Tệp Excel không chứa sheet dữ liệu nào' };
    }
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length < 2) {
      throw { statusCode: 400, message: 'Tệp Excel không có dòng dữ liệu học viên nào' };
    }

    const results = {
      totalRows: rows.length - 1,
      successCount: 0,
      errorCount: 0,
      createdUsers: [] as any[],
      errors: [] as Array<{ row: number; email?: string; reason: string }>,
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const defaultPassword = 'Aptis@2026';
    const defaultHash = await hashPassword(defaultPassword);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[1]) continue;

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

      const role =
        roleStr === 'TEACHER'
          ? UserRole.TEACHER
          : roleStr === 'ADMIN'
          ? UserRole.ADMIN
          : UserRole.STUDENT;

      const targetBand = targetStr.includes('B1')
        ? TargetBand.B1_TARGET
        : targetStr.includes('C')
        ? TargetBand.C_TARGET
        : TargetBand.B2_TARGET;

      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          results.errorCount++;
          results.errors.push({ row: i + 1, email, reason: 'Email đã tồn tại trên hệ thống' });
          continue;
        }

        const passwordHash =
          rawPassword === defaultPassword ? defaultHash : await hashPassword(rawPassword);

        const newUser = await prisma.user.create({
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
      } catch (err: any) {
        results.errorCount++;
        results.errors.push({ row: i + 1, email, reason: err.message || 'Lỗi lưu trữ cơ sở dữ liệu' });
      }
    }

    auditService.record({
      req,
      action: AuditAction.USER_CREATE,
      entityType: 'USER_BATCH',
      entityId: 'BULK_IMPORT',
      description: `Nhập học viên hàng loạt từ Excel: Thành công ${results.successCount}/${results.totalRows}, Thất bại: ${results.errorCount}`,
      newValue: { successCount: results.successCount, errorCount: results.errorCount },
    });

    return results;
  }

  async updateUserStatus(userId: string, isActive: boolean, req?: Request) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'Người dùng không tồn tại' };
    }

    if (user.role === 'SUPER_ADMIN' && (req as any)?.user?.role !== 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Chỉ Tổng quản trị mới có quyền thay đổi trạng thái của tài khoản Super Admin' };
    }

    const updated = await prisma.user.update({
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

    auditService.record({
      req,
      action: AuditAction.USER_STATUS_CHANGE,
      entityType: 'USER',
      entityId: userId,
      description: `Cập nhật trạng thái tài khoản ${user.full_name} (${user.email}) thành ${isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}`,
      oldValue: { is_active: user.is_active },
      newValue: { is_active: isActive },
    });

    return updated;
  }

  async createExam(input: AdminCreateExamInput, req?: Request) {
    const exam = await prisma.exam.create({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_CREATE,
      entityType: 'EXAM',
      entityId: exam.id,
      description: `Tạo đề thi mới: "${exam.title}" (Kỹ năng: ${exam.skill}, Thời lượng: ${exam.duration_minutes}p)`,
      newValue: { title: exam.title, skill: exam.skill, durationMinutes: exam.duration_minutes, isPro: exam.is_pro },
    });

    return exam;
  }

  async deleteExam(examId: string, req?: Request) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    await prisma.exam.delete({ where: { id: examId } });

    auditService.record({
      req,
      action: AuditAction.EXAM_DELETE,
      entityType: 'EXAM',
      entityId: examId,
      description: `Xóa đề thi khỏi hệ thống: "${exam.title}" (${exam.skill})`,
      oldValue: { title: exam.title, skill: exam.skill, durationMinutes: exam.duration_minutes },
    });

    return { success: true, message: 'Xóa đề thi thành công' };
  }

  async updateExam(examId: string, input: any, req?: Request) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw { statusCode: 404, message: 'Đề thi không tồn tại' };

    const updated = await prisma.exam.update({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
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
  async getExamFull(examId: string) {
    const exam = await prisma.exam.findUnique({
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
    if (!exam) throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    return exam;
  }

  // ──────────────────────────────────────────────────────────────
  // CONTENT EDITOR: Update a Part (passage, audio, image, instructions)
  // ──────────────────────────────────────────────────────────────
  async updatePart(partId: string, input: any, req?: Request) {
    const part = await prisma.examPart.findUnique({ where: { id: partId } });
    if (!part) throw { statusCode: 404, message: 'Phần thi không tồn tại' };

    const updated = await prisma.examPart.update({
      where: { id: partId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.instructions !== undefined && { instructions: input.instructions }),
        ...(input.passageText !== undefined && { passage_text: input.passageText }),
        ...(input.audioUrl !== undefined && { audio_url: input.audioUrl }),
        ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
      },
    });

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
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
  async addPart(examId: string, input: any, req?: Request) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw { statusCode: 404, message: 'Đề thi không tồn tại' };

    const maxPart = await prisma.examPart.findFirst({
      where: { exam_id: examId },
      orderBy: { part_number: 'desc' },
    });

    const newPartNumber = (maxPart?.part_number || 0) + 1;

    const part = await prisma.examPart.create({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
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
  async deletePart(partId: string, req?: Request) {
    const part = await prisma.examPart.findUnique({
      where: { id: partId },
      include: { _count: { select: { questions: true } } },
    });
    if (!part) throw { statusCode: 404, message: 'Phần thi không tồn tại' };

    await prisma.examPart.delete({ where: { id: partId } });

    auditService.record({
      req,
      action: AuditAction.EXAM_DELETE,
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
  async updateQuestion(questionId: string, input: any, req?: Request) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw { statusCode: 404, message: 'Câu hỏi không tồn tại' };

    const updated = await prisma.question.update({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
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
  async addQuestion(partId: string, input: any, req?: Request) {
    const part = await prisma.examPart.findUnique({ where: { id: partId } });
    if (!part) throw { statusCode: 404, message: 'Phần thi không tồn tại' };

    const maxQ = await prisma.question.findFirst({
      where: { part_id: partId },
      orderBy: { question_number: 'desc' },
    });
    const nextNum = input.questionNumber || (maxQ?.question_number || 0) + 1;

    const question = await prisma.question.create({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
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
  async deleteQuestion(questionId: string, req?: Request) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw { statusCode: 404, message: 'Câu hỏi không tồn tại' };

    await prisma.question.delete({ where: { id: questionId } });

    auditService.record({
      req,
      action: AuditAction.EXAM_DELETE,
      entityType: 'QUESTION',
      entityId: questionId,
      description: `Xóa câu hỏi #${question.question_number}: "${(question.prompt || '').slice(0, 40)}..."`,
      oldValue: { questionId, prompt: question.prompt, questionNumber: question.question_number },
    });

    return { success: true };
  }

  async duplicateExam(examId: string, req?: Request) {
    const sourceExam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        parts: {
          include: { questions: true },
        },
      },
    });

    if (!sourceExam) throw { statusCode: 404, message: 'Đề thi gốc không tồn tại' };

    const cloned = await prisma.exam.create({
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

    auditService.record({
      req,
      action: AuditAction.EXAM_CREATE,
      entityType: 'EXAM',
      entityId: cloned.id,
      description: `Nhân bản đề thi từ "${sourceExam.title}" thành "${cloned.title}"`,
      newValue: { title: cloned.title, skill: cloned.skill },
    });

    return cloned;
  }

  async listTransactions(page: number = 1, limit: number = 20, status?: TransactionStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
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
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveTransaction(transactionId: string, input: AdminResolveTransactionInput, req?: Request) {
    const txRecord = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!txRecord) {
      throw { statusCode: 404, message: 'Giao dịch không tồn tại' };
    }

    const targetUserId = input.targetUserId || txRecord.user_id;
    const targetUser = input.targetUserId
      ? await prisma.user.findUnique({ where: { id: input.targetUserId } })
      : txRecord.user;

    // Thực thi trong Prisma Transaction ATOMIC
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          user_id: targetUserId,
          status: input.status,
          paid_at: input.status === TransactionStatus.COMPLETED ? new Date() : txRecord.paid_at,
        },
      });

      // Nếu duyệt thành công (COMPLETED), kích hoạt hoặc gia hạn gói VIP cộng dồn cho học viên
      if (input.status === TransactionStatus.COMPLETED) {
        const defaultPlan =
          (await tx.subscriptionPlan.findFirst({
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
          } else {
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

    auditService.record({
      req,
      action: AuditAction.PAYMENT_MANUAL_RESOLVE,
      entityType: 'TRANSACTION',
      entityId: transactionId,
      description: `Khớp lệnh thủ công đơn hàng ${txRecord.order_code} (${txRecord.amount.toLocaleString('vi-VN')}đ) cho học viên ${targetUser?.full_name || txRecord.user.full_name} sang ${input.status}`,
      oldValue: { status: txRecord.status, userId: txRecord.user_id },
      newValue: { status: input.status, note: input.note, userId: targetUserId },
    });

    return updated;
  }

  async createManualTransaction(input: AdminCreateManualTransactionInput, req?: Request) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw { statusCode: 404, message: 'Học viên không tồn tại' };
    }

    const orderCode = `OFFLINE_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    let plan = null;
    if (input.planId) {
      plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    }
    if (!plan) {
      plan =
        (await prisma.subscriptionPlan.findFirst({
          where: { is_active: true, price_vnd: { lte: input.amount } },
          orderBy: { price_vnd: 'desc' },
        })) ||
        (await prisma.subscriptionPlan.findFirst({
          where: { is_active: true },
          orderBy: { price_vnd: 'asc' },
        }));
    }

    const result = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          user_id: input.userId,
          order_code: orderCode,
          amount: input.amount,
          status: TransactionStatus.COMPLETED,
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
        } else {
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

    auditService.record({
      req,
      action: AuditAction.PAYMENT_MANUAL_RESOLVE,
      entityType: 'TRANSACTION',
      entityId: result.id,
      description: `Tạo giao dịch nạp tiền thủ công ${orderCode} (${input.amount.toLocaleString('vi-VN')}đ) cho học viên ${user.full_name}: ${input.note || 'Khớp lệnh học vụ'}`,
      newValue: { orderCode, amount: input.amount, userId: input.userId, note: input.note },
    });

    return result;
  }

  async grantVip(userId: string, input: AdminGrantVipInput, req?: Request) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'Người dùng không tồn tại' };
    }

    let plan = null;
    if (input.planId) {
      plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    }
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { is_active: true },
        orderBy: { duration_days: 'asc' },
      });
    }
    if (!plan) {
      // Fallback an toàn nếu chưa có plan nào
      plan = await prisma.subscriptionPlan.findFirst();
    }

    if (!plan) {
      throw { statusCode: 500, message: 'Hệ thống chưa thiết lập gói cước nào' };
    }

    const days = input.days || plan.duration_days || 30;
    const now = new Date();
    const durationMs = days * 24 * 60 * 60 * 1000;

    // Kiểm tra subscription hiện tại còn hạn để cộng dồn
    const existingSub = await prisma.userSubscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        end_date: { gt: now },
      },
      orderBy: { end_date: 'desc' },
    });

    let subscription;
    let newEndDate: Date;

    if (existingSub) {
      newEndDate = new Date(existingSub.end_date.getTime() + durationMs);
      subscription = await prisma.userSubscription.update({
        where: { id: existingSub.id },
        data: {
          plan_id: plan.id,
          end_date: newEndDate,
          ai_quota_left: existingSub.ai_quota_left + (plan.ai_quota || 50),
          teacher_quota_left: existingSub.teacher_quota_left + (plan.teacher_quota || 5),
        },
        include: { plan: true },
      });
    } else {
      newEndDate = new Date(now.getTime() + durationMs);
      subscription = await prisma.userSubscription.create({
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

    auditService.record({
      req,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'USER',
      entityId: userId,
      description: `Cấp/Gia hạn VIP ${days} ngày cho học viên ${user.full_name} (${user.email}). Lý do: ${input.reason || 'Học vụ kích hoạt'}`,
      newValue: { days, planName: plan.name, reason: input.reason, endDate: newEndDate },
    });

    return subscription;
  }

  async resetPassword(userId: string, input: AdminResetPasswordInput, req?: Request) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'Người dùng không tồn tại' };
    }

    if (user.role === 'SUPER_ADMIN' && (req as any)?.user?.role !== 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Chỉ Tổng quản trị mới có quyền đặt lại mật khẩu của tài khoản Super Admin' };
    }

    const newPassword = input.newPassword || 'Aptis123';
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });

    auditService.record({
      req,
      action: AuditAction.AUTH_PASSWORD_RESET,
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

  async adjustQuota(userId: string, input: AdminAdjustQuotaInput, req?: Request) {
    const sub = await prisma.userSubscription.findFirst({
      where: { user_id: userId, is_active: true },
      orderBy: { end_date: 'desc' },
    });

    if (!sub) {
      throw {
        statusCode: 400,
        message: 'Học viên chưa có gói VIP hoạt động. Vui lòng kích hoạt gói VIP trước khi cộng lượt chấm.',
      };
    }

    const updated = await prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        ai_quota_left: { increment: input.aiQuota },
        teacher_quota_left: input.teacherQuota ? { increment: input.teacherQuota } : undefined,
      },
    });

    auditService.record({
      req,
      action: AuditAction.PLAN_UPDATE,
      entityType: 'SUBSCRIPTION',
      entityId: sub.id,
      description: `Cộng thêm ${input.aiQuota} lượt chấm AI cho học viên. Lý do: ${input.reason || 'Học vụ hỗ trợ'}`,
      newValue: { addedAiQuota: input.aiQuota, currentAiQuota: updated.ai_quota_left },
    });

    return updated;
  }

  async getUserSummary(userId: string) {
    const user = await prisma.user.findUnique({
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

  async listExams(page: number = 1, limit: number = 50, skill?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (skill && skill !== 'ALL') {
      where.skill = skill;
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
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
      prisma.exam.count({ where }),
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
    const plans = await prisma.subscriptionPlan.findMany({
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

  async updatePlan(
    planId: string,
    input: { price_vnd?: number; ai_quota?: number; teacher_quota?: number; is_active?: boolean },
    req?: Request
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw { statusCode: 404, message: 'Gói cước không tồn tại' };
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...(input.price_vnd !== undefined && { price_vnd: input.price_vnd }),
        ...(input.ai_quota !== undefined && { ai_quota: input.ai_quota }),
        ...(input.teacher_quota !== undefined && { teacher_quota: input.teacher_quota }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
    });

    auditService.record({
      req,
      action: AuditAction.PLAN_UPDATE,
      entityType: 'PLAN',
      entityId: planId,
      description: `Cập nhật cấu hình gói cước ${plan.name} (${plan.code})`,
      oldValue: { price_vnd: plan.price_vnd, ai_quota: plan.ai_quota, teacher_quota: plan.teacher_quota, is_active: plan.is_active },
      newValue: input,
    });

    return updated;
  }

  async getDashboardKPIs() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalExams,
      totalUsers,
      activeUsers,
      totalAttempts,
      todayAttempts,
      totalTransactions,
      pendingTransactionsCount,
      pendingGradingCount,
      pendingTransactions,
    ] = await Promise.all([
      prisma.exam.count(),
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.examSubmission.count(),
      prisma.examSubmission.count({
        where: { started_at: { gte: startOfToday } },
      }),
      prisma.transaction.aggregate({
        where: { status: TransactionStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: { status: TransactionStatus.PENDING },
      }),
      prisma.examSubmission.count({
        where: { status: SubmissionStatus.PENDING_EVALUATION },
      }),
      prisma.transaction.findMany({
        where: { status: TransactionStatus.PENDING },
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, full_name: true, email: true, phone_number: true },
          },
        },
      }),
    ]);

    // Lấy số liệu 7 ngày gần nhất để vẽ biểu đồ lượt thi và doanh thu
    const daysArray = [6, 5, 4, 3, 2, 1, 0];
    const [dailyAttempts, dailyRevenue] = await Promise.all([
      Promise.all(
        daysArray.map(async (i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);

          const count = await prisma.examSubmission.count({
            where: {
              started_at: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          });

          const dayStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          return {
            date: d.toISOString().split('T')[0],
            label: dayStr,
            attempts: count,
          };
        })
      ),
      Promise.all(
        daysArray.map(async (i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);

          const rev = await prisma.transaction.aggregate({
            where: {
              status: TransactionStatus.COMPLETED,
              created_at: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
            _sum: { amount: true },
          });

          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          const dayStr = dayNames[d.getDay()];
          return {
            date: d.toISOString().split('T')[0],
            label: dayStr,
            amount: rev._sum.amount || 0,
          };
        })
      ),
    ]);

    // Thống kê phân bổ CEFR thật từ kết quả bài thi
    const [bandC, bandB2, bandB1, bandA, avgScoreRes, completedSubmissionsCount, skillStats, recentSubmissions, recentTransactions] = await Promise.all([
      prisma.examSubmission.count({
        where: {
          OR: [{ cefr_level: 'C1' }, { cefr_level: 'C2' }, { total_score: { gte: 160 } }],
        },
      }),
      prisma.examSubmission.count({
        where: {
          OR: [
            { cefr_level: 'B2' },
            { AND: [{ total_score: { gte: 120 } }, { total_score: { lt: 160 } }] },
          ],
        },
      }),
      prisma.examSubmission.count({
        where: {
          OR: [
            { cefr_level: 'B1' },
            { AND: [{ total_score: { gte: 80 } }, { total_score: { lt: 120 } }] },
          ],
        },
      }),
      prisma.examSubmission.count({
        where: {
          OR: [
            { cefr_level: 'A2' },
            { cefr_level: 'A1' },
            { AND: [{ total_score: { gt: 0 } }, { total_score: { lt: 80 } }] },
          ],
        },
      }),
      prisma.examSubmission.aggregate({
        where: { total_score: { not: null, gt: 0 } },
        _avg: { total_score: true },
      }),
      prisma.examSubmission.count({
        where: {
          status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED] },
        },
      }),
      prisma.exam.groupBy({
        by: ['skill'],
        _count: { id: true },
      }),
      prisma.examSubmission.findMany({
        take: 5,
        orderBy: { started_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          exam: { select: { id: true, title: true, skill: true } },
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
        },
      }),
    ]);

    // Tổng hợp sự kiện hoạt động học viên thực tế
    const recentActivities: Array<{
      id: string;
      user: string;
      avatar: string;
      action: string;
      detail: string;
      time: string;
      type: 'exam' | 'payment';
      badge: string;
      badgeColor: string;
      createdAt: string;
    }> = [];

    const now = Date.now();
    const getRelativeTimeString = (date: Date) => {
      const diffMs = now - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
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

    const skillCounts: Record<string, number> = {
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

    return {
      totalExams,
      totalUsers,
      activeUsers,
      totalAttempts,
      todayAttempts,
      totalRevenueVND: totalTransactions._sum.amount || 0,
      pendingTransactionsCount,
      pendingGradingCount,
      pendingTransactions,
      dailyAttempts,
      dailyRevenue,
      bandDistribution,
      skillCounts,
      recentActivities,
      averageScore,
      completionRate,
    };
  }
}

export const adminService = new AdminService();
