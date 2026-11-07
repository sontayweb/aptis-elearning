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
  AdminCreatePromotionInput,
  AdminUpdatePromotionInput,
} from './admin.dto';
import { TransactionStatus, SubmissionStatus, AuditAction, TargetBand, UserRole, NotificationType } from '@prisma/client';
import { notifyUser } from '../notifications/notify.helper';
import { auditService } from '../audit/audit.service';
import { Request } from 'express';
import { grantOrExtendSubscription } from '../../utils/subscription-helper';
import { parsePaymentMetadata } from '../payment/payment.service';
import * as xlsx from 'xlsx';
import { emailService } from '../email/email.service';
import { emailQueue } from '../email/email.queue';
import { ensureTwentyFullTestExams, rerandomizeSingleFullTestExam } from '../exams/fulltest-generator';
import fs from 'fs';
import path from 'path';

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

    // Gửi email chào mừng và cấp thông tin đăng nhập cho người dùng
    emailService.sendAccountCreatedEmail(user.email, input.password, user.full_name, user.role).catch((err) => {
      console.error(`[AdminService] Lỗi gửi email tạo tài khoản cho ${user.email}:`, err);
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

        // K6: Đẩy email tạo tài khoản hàng loạt qua hàng đợi BullMQ (rate 5 email/giây + retry) để tránh vượt 10 req/s của Resend
        emailQueue
          .enqueue(emailService.buildAccountCreatedMail(email, rawPassword, fullName, roleStr))
          .catch((err) => {
            console.error(`[AdminService] Lỗi xếp hàng đợi email tạo tài khoản cho ${email}:`, err);
          });
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

    // Luồng bắt buộc: báo cho người dùng biết tài khoản bị khóa / được mở khóa (chuông + email)
    if (user.is_active !== isActive) {
      notifyUser({
        userId,
        title: isActive ? 'Tài khoản của bạn đã được mở khóa' : 'Tài khoản của bạn đã bị khóa',
        message: isActive
          ? 'Tài khoản đã được mở khóa, bạn có thể đăng nhập và tiếp tục học tập.'
          : 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.',
        link: '/profile',
        email: {
          subject: isActive ? 'Tài khoản đã được mở khóa' : 'Tài khoản của bạn đã bị khóa',
          paragraphs: isActive
            ? ['Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập và tiếp tục học tập.']
            : [
                'Tài khoản của bạn đã bị tạm khóa bởi quản trị viên.',
                'Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ hỗ trợ (Zalo/Hotline) để được xử lý.',
              ],
          ctaLabel: isActive ? 'Đăng nhập' : undefined,
          ctaPath: isActive ? '/login' : undefined,
        },
      });
    }

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
        hot_level: input.hotLevel ?? 0,
        forecast_tag: input.forecastTag ?? null,
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
      newValue: { title: exam.title, skill: exam.skill, durationMinutes: exam.duration_minutes, isPro: exam.is_pro, hotLevel: exam.hot_level },
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

  /**
   * Gán độ hot (0–5) / trạng thái xuất bản hàng loạt.
   * - examIds: cập nhật theo danh sách ID đã chọn.
   * - rules: [{ keywords: string[], hotLevel }] khớp theo tên đề (không phân biệt hoa/thường, dấu cách),
   *   có thể lọc theo skill (+ partNumber).
   */
  async bulkUpdateHotLevel(
    input: {
      examIds?: string[];
      hotLevel?: number;
      isPublished?: boolean;
      skill?: string;
      rules?: Array<{ keywords: string[]; hotLevel: number }>;
    },
    req?: Request
  ) {
    const norm = (s: string) =>
      s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9à-ỹ]+/gi, ' ').trim();
    const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    let updated = 0;
    const unmatched: string[] = [];
    const matchedSummary: Array<{ keyword: string; hotLevel: number; count: number }> = [];

    if (input.examIds?.length) {
      const data: any = {};
      if (input.hotLevel !== undefined) data.hot_level = clamp(input.hotLevel);
      if (input.isPublished !== undefined) data.is_published = input.isPublished;
      if (Object.keys(data).length) {
        const r = await prisma.exam.updateMany({ where: { id: { in: input.examIds } }, data });
        updated += r.count;
      }
    }

    if (input.rules?.length) {
      const candidates = await prisma.exam.findMany({
        where: { ...(input.skill && input.skill !== 'ALL' ? { skill: input.skill as any } : {}) },
        select: { id: true, title: true, description: true },
      });
      const indexed = candidates.map((c) => ({
        id: c.id,
        key: norm(`${c.title} ${c.description || ''}`),
      }));
      for (const rule of input.rules) {
        const level = clamp(rule.hotLevel);
        for (const raw of rule.keywords || []) {
          const kw = norm(raw);
          if (!kw) continue;
          const ids = indexed.filter((c) => c.key.includes(kw)).map((c) => c.id);
          if (!ids.length) {
            unmatched.push(raw);
            continue;
          }
          const r = await prisma.exam.updateMany({
            where: { id: { in: ids } },
            data: { hot_level: level },
          });
          updated += r.count;
          matchedSummary.push({ keyword: raw, hotLevel: level, count: r.count });
        }
      }
    }

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'EXAM_BATCH',
      entityId: 'BULK_HOT_LEVEL',
      description: `Gán độ hot hàng loạt: cập nhật ${updated} đề, không khớp ${unmatched.length} từ khóa`,
    });

    return { updated, unmatched, matched: matchedSummary };
  }

  async rerandomizeFullTestExam(examId: string, req?: Request) {
    const updated = await rerandomizeSingleFullTestExam(prisma, examId);
    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'EXAM',
      entityId: examId,
      description: `Trộn lại (Re-randomize) bộ 16 Parts cho đề thi thử Full Test: "${updated?.title || examId}"`,
    });
    return updated;
  }

  async generateFullTestExams(req?: Request) {
    await ensureTwentyFullTestExams(prisma, { forceAll: true });
    auditService.record({
      req,
      action: AuditAction.EXAM_CREATE,
      entityType: 'EXAM_BATCH',
      entityId: 'APT_01_20',
      description: `Khôi phục / Tạo tự động đủ 20 bộ đề thi thử Full Test (APT-01 đến APT-20) từ ngân hàng câu hỏi`,
    });
    return { success: true };
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
        ...(input.hotLevel !== undefined && { hot_level: Number(input.hotLevel) }),
        ...(input.forecastTag !== undefined && { forecast_tag: input.forecastTag }),
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

    // Dọn dẹp ảnh cũ nếu người dùng đổi hoặc gỡ ảnh (tránh rác bộ nhớ server)
    if (input.imageUrl !== undefined && part.image_url && part.image_url !== input.imageUrl) {
      if (part.image_url.startsWith('/uploads/exams/')) {
        this.safeDeleteExamImage(part.image_url);
      }
    }

    // Dọn dẹp audio cũ nếu người dùng đổi hoặc gỡ audio (tránh rác bộ nhớ server)
    if (input.audioUrl !== undefined && part.audio_url && part.audio_url !== input.audioUrl) {
      if (part.audio_url.startsWith('/uploads/audio/')) {
        this.safeDeleteExamAudio(part.audio_url);
      }
    }

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

    // Dọn dẹp ảnh đính kèm nếu có khi xóa part
    if (part.image_url && part.image_url.startsWith('/uploads/exams/')) {
      this.safeDeleteExamImage(part.image_url);
    }

    // Dọn dẹp audio đính kèm nếu có khi xóa part
    if (part.audio_url && part.audio_url.startsWith('/uploads/audio/')) {
      this.safeDeleteExamAudio(part.audio_url);
    }

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
  // FILE STORAGE: Xóa an toàn ảnh đính kèm đề thi khỏi máy chủ
  // ──────────────────────────────────────────────────────────────
  safeDeleteExamImage(imageUrl?: string | null): boolean {
    try {
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/exams/')) {
        return false;
      }
      const allowedRoot = path.resolve(process.env.UPLOAD_DIR || './uploads', 'exams');
      const relPath = imageUrl.replace(/^\/?(api\/)?uploads\/?/, '');
      const fullPath = path.resolve(process.env.UPLOAD_DIR || './uploads', relPath);

      // Chống Path Traversal: Đảm bảo đường dẫn tuyệt đối phải nằm trong thư mục uploads/exams
      if (!fullPath.startsWith(allowedRoot)) {
        return false;
      }

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // FILE STORAGE: Xóa an toàn audio đính kèm đề thi khỏi máy chủ
  // ──────────────────────────────────────────────────────────────
  safeDeleteExamAudio(audioUrl?: string | null): boolean {
    try {
      if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('/uploads/audio/')) {
        return false;
      }
      const allowedRoot = path.resolve(process.env.UPLOAD_DIR || './uploads', 'audio');
      const relPath = audioUrl.replace(/^\/?(api\/)?uploads\/?/, '');
      const fullPath = path.resolve(process.env.UPLOAD_DIR || './uploads', relPath);

      // Chống Path Traversal: Đảm bảo đường dẫn tuyệt đối phải nằm trong thư mục uploads/audio
      if (!fullPath.startsWith(allowedRoot)) {
        return false;
      }

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
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
        ...(input.explanation !== undefined && {
          explanation: input.explanation && String(input.explanation).trim() ? String(input.explanation).trim() : null,
        }),
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
        explanation: input.explanation && String(input.explanation).trim() ? String(input.explanation).trim() : null,
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

    // Thực thi trong Prisma Transaction ATOMIC (Chống Race Condition khi 2 Admin bấm duyệt cùng lúc)
    let activatedPlanName: string | undefined;
    let activatedSub: { end_date: Date; ai_quota_left: number; teacher_quota_left: number } | undefined;
    let didTransitionStatus = false;

    const resolveTargetPlan = async (tx: any) => {
      const meta = parsePaymentMetadata(txRecord.payment_method, txRecord.order_code);
      let targetPlan = null;

      if (input.planId) {
        targetPlan = await tx.subscriptionPlan.findUnique({ where: { id: input.planId } });
      }
      if (!targetPlan && meta.planCode) {
        targetPlan = await tx.subscriptionPlan.findUnique({ where: { code: meta.planCode } });
      }
      if (!targetPlan && meta.targetDurationDays) {
        targetPlan = await tx.subscriptionPlan.findFirst({
          where: { is_active: true, duration_days: meta.targetDurationDays },
          orderBy: { price_vnd: 'desc' },
        });
      }
      if (!targetPlan) {
        targetPlan =
          (await tx.subscriptionPlan.findFirst({
            where: { is_active: true, price_vnd: { gt: 0, lte: txRecord.amount } },
            orderBy: { price_vnd: 'desc' },
          })) ||
          (await tx.subscriptionPlan.findFirst({
            where: { is_active: true, price_vnd: { gt: 0 } },
            orderBy: { price_vnd: 'asc' },
          })) ||
          (await tx.subscriptionPlan.findFirst({
            where: { is_active: true },
            orderBy: { price_vnd: 'asc' },
          }));
      }
      return targetPlan;
    };

    const updated = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Khóa dòng nguyên tử theo trạng thái đích
      if (input.status === TransactionStatus.COMPLETED) {
        if (typeof tx.transaction?.updateMany === 'function') {
          const claimed = await tx.transaction.updateMany({
            where: {
              id: transactionId,
              status: { not: TransactionStatus.COMPLETED },
            },
            data: {
              user_id: targetUserId,
              status: TransactionStatus.COMPLETED,
              paid_at: now,
            },
          });
          didTransitionStatus = Boolean(claimed && claimed.count > 0);
        } else {
          didTransitionStatus = txRecord.status !== TransactionStatus.COMPLETED;
        }
      } else if (input.status === TransactionStatus.REFUNDED) {
        if (typeof tx.transaction?.updateMany === 'function') {
          const claimed = await tx.transaction.updateMany({
            where: {
              id: transactionId,
              status: { not: TransactionStatus.REFUNDED },
            },
            data: {
              user_id: targetUserId,
              status: TransactionStatus.REFUNDED,
            },
          });
          didTransitionStatus = Boolean(claimed && claimed.count > 0);
        } else {
          didTransitionStatus = txRecord.status !== TransactionStatus.REFUNDED;
        }
      } else {
        didTransitionStatus = txRecord.status !== input.status;
      }

      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          user_id: targetUserId,
          status: input.status,
          paid_at: input.status === TransactionStatus.COMPLETED ? now : txRecord.paid_at,
        },
      });

      // 2. Nếu vừa chuyển sang COMPLETED (chỉ đúng 1 luồng thắng khóa nguyên tử), cộng dồn VIP
      if (input.status === TransactionStatus.COMPLETED && didTransitionStatus) {
        const targetPlan = await resolveTargetPlan(tx);
        if (targetPlan) {
          activatedPlanName = targetPlan.name;
          activatedSub = await grantOrExtendSubscription(tx, {
            userId: targetUserId,
            planId: targetPlan.id,
            transactionId: txRecord.id,
          });
        }
      }

      // 3. Nếu đơn đã COMPLETED trước đó mà bị chuyển sang REFUNDED -> Thu hồi số ngày & quota tương ứng
      if (
        input.status === TransactionStatus.REFUNDED &&
        didTransitionStatus &&
        txRecord.status === TransactionStatus.COMPLETED &&
        typeof tx.userSubscription?.findFirst === 'function'
      ) {
        const refundedPlan = await resolveTargetPlan(tx);
        const activeSub = await tx.userSubscription.findFirst({
          where: {
            user_id: targetUserId,
            is_active: true,
          },
          orderBy: { end_date: 'desc' },
        });

        if (activeSub && refundedPlan) {
          const revokeMs = (refundedPlan.duration_days || 30) * 24 * 60 * 60 * 1000;
          const newEndDate = new Date(new Date(activeSub.end_date).getTime() - revokeMs);
          const newAiQuota = Math.max(0, (activeSub.ai_quota_left || 0) - (refundedPlan.ai_quota ?? 0));
          const newTeacherQuota = Math.max(
            0,
            (activeSub.teacher_quota_left || 0) - (refundedPlan.teacher_quota ?? 0)
          );
          const stillActive = newEndDate > now;

          await tx.userSubscription.update({
            where: { id: activeSub.id },
            data: {
              end_date: stillActive ? newEndDate : now,
              is_active: stillActive,
              ai_quota_left: stillActive ? newAiQuota : 0,
              teacher_quota_left: stillActive ? newTeacherQuota : 0,
            },
          });
        }
      }

      return updatedTx;
    });

    // Luồng bắt buộc #8 & #10: báo kết quả xử lý giao dịch cho học viên (kích hoạt bù / thất bại / hoàn tiền)
    const amountText = `${txRecord.amount.toLocaleString('vi-VN')}đ`;
    if (input.status === TransactionStatus.COMPLETED && didTransitionStatus) {
      const endDateStr = activatedSub?.end_date ? new Date(activatedSub.end_date).toLocaleDateString('vi-VN') : '';
      // 1. Bắn chuông VIP_ACTIVATED
      notifyUser({
        userId: targetUserId,
        type: NotificationType.VIP_ACTIVATED,
        title: 'Đã kích hoạt bù gói VIP thành công',
        message: `Đơn ${txRecord.order_code} (${amountText}) đã được xác nhận${activatedPlanName ? `, gói ${activatedPlanName} được kích hoạt đến ${endDateStr}` : ''}.`,
        link: '/pricing',
      });
      // 2. Gửi biên nhận VIP đầy đủ (gói, hạn dùng, lượt AI, lượt Giáo viên) đồng bộ với SePay
      if (targetUser?.email && activatedPlanName && activatedSub) {
        emailService
          .sendVipActivatedEmail(targetUser.email, {
            fullName: targetUser.full_name || 'Học viên',
            planName: activatedPlanName,
            endDate: activatedSub.end_date,
            aiQuota: activatedSub.ai_quota_left,
            teacherQuota: activatedSub.teacher_quota_left,
          })
          .catch(() => {});
      }
    } else if (
      (input.status === TransactionStatus.FAILED || input.status === TransactionStatus.REFUNDED) &&
      didTransitionStatus
    ) {
      const refunded = input.status === TransactionStatus.REFUNDED;
      notifyUser({
        userId: targetUserId,
        title: refunded ? 'Đơn hàng đã được hoàn tiền' : 'Thanh toán không thành công',
        message: refunded
          ? `Đơn ${txRecord.order_code} (${amountText}) đã được hoàn tiền.`
          : `Đơn ${txRecord.order_code} (${amountText}) không thành công. Vui lòng liên hệ hỗ trợ nếu bạn đã chuyển khoản.`,
        link: '/profile',
        email: {
          subject: refunded
            ? `Hoàn tiền đơn hàng ${txRecord.order_code}`
            : `Thanh toán đơn hàng ${txRecord.order_code} không thành công`,
          paragraphs: [
            refunded
              ? `Đơn hàng ${txRecord.order_code} (${amountText}) đã được hoàn tiền. Thời gian tiền về tài khoản phụ thuộc ngân hàng của bạn.`
              : `Đơn hàng ${txRecord.order_code} (${amountText}) chưa được ghi nhận thanh toán thành công.`,
            ...(input.note ? [`Ghi chú từ quản trị viên: ${input.note}`] : []),
            'Nếu cần hỗ trợ, vui lòng liên hệ Zalo/Hotline của Aptis.',
          ],
        },
      });
    }

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

    // Chống trùng lặp (Idempotency Guard): Chặn click đúp chuột tạo 2 giao dịch giống hệt nhau trong 2 phút
    if (typeof prisma.transaction?.findFirst === 'function') {
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
      const duplicateManualTx = await prisma.transaction.findFirst({
        where: {
          user_id: input.userId,
          amount: input.amount,
          status: TransactionStatus.COMPLETED,
          order_code: { startsWith: 'OFFLINE_' },
          created_at: { gte: twoMinsAgo },
        },
      });
      if (duplicateManualTx) {
        throw {
          statusCode: 409,
          message: `Giao dịch thủ công (${duplicateManualTx.order_code}) với cùng số tiền cho học viên này vừa được tạo trong 2 phút qua. Đã chặn tự động để tránh cộng trùng VIP.`,
        };
      }
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
        await grantOrExtendSubscription(tx, {
          userId: input.userId,
          planId: plan.id,
          transactionId: newTx.id,
        });
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

    // Biên nhận cho học viên: giao dịch thủ công đã được ghi nhận
    notifyUser({
      userId: input.userId,
      type: NotificationType.VIP_ACTIVATED,
      title: 'Đã ghi nhận thanh toán của bạn',
      message: `Đơn ${orderCode} (${input.amount.toLocaleString('vi-VN')}đ) đã được ghi nhận${plan ? `, gói ${plan.name} đã được kích hoạt` : ''}.`,
      link: '/pricing',
      email: {
        subject: `Xác nhận thanh toán đơn ${orderCode}`,
        paragraphs: [
          `Đơn hàng ${orderCode} (${input.amount.toLocaleString('vi-VN')}đ) đã được quản trị viên ghi nhận.`,
          plan ? `Gói ${plan.name} đã được kích hoạt cho tài khoản của bạn.` : 'Quyền lợi tài khoản đã được cập nhật.',
        ],
        ctaLabel: 'Bắt đầu luyện thi',
        ctaPath: '/thi-thu',
      },
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
    const subscription = await grantOrExtendSubscription(prisma, {
      userId,
      planId: plan.id,
      customDurationDays: days,
      customAiQuota: plan.ai_quota ?? 10,
      customTeacherQuota: plan.teacher_quota ?? 0,
    });
    const newEndDate = subscription.end_date;

    auditService.record({
      req,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'USER',
      entityId: userId,
      description: `Cấp/Gia hạn VIP ${days} ngày cho học viên ${user.full_name} (${user.email}). Lý do: ${input.reason || 'Học vụ kích hoạt'}`,
      newValue: { days, planName: plan.name, reason: input.reason, endDate: newEndDate },
    });

    notifyUser({
      userId,
      type: NotificationType.VIP_ACTIVATED,
      title: 'Bạn được cấp/gia hạn VIP',
      message: `Gói ${plan.name} đã được kích hoạt${newEndDate ? `, hạn sử dụng đến ${new Date(newEndDate).toLocaleDateString('vi-VN')}` : ''}.`,
      link: '/pricing',
      email: {
        subject: `Tài khoản của bạn đã được cấp gói ${plan.name}`,
        paragraphs: [
          `Quản trị viên đã cấp/gia hạn gói ${plan.name} (${days} ngày) cho tài khoản của bạn.`,
          ...(newEndDate ? [`Hạn sử dụng đến: ${new Date(newEndDate).toLocaleDateString('vi-VN')}.`] : []),
        ],
        ctaLabel: 'Bắt đầu luyện thi',
        ctaPath: '/thi-thu',
      },
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

    // Báo cho người dùng biết (không kèm mật khẩu trong thông báo)
    notifyUser({
      userId,
      title: 'Quản trị viên đã đặt lại mật khẩu của bạn',
      message: 'Mật khẩu tài khoản vừa được quản trị viên đặt lại. Hãy đăng nhập và đổi mật khẩu mới ngay.',
      link: '/profile',
      email: {
        subject: 'Mật khẩu tài khoản đã được đặt lại bởi quản trị viên',
        paragraphs: [
          'Mật khẩu tài khoản của bạn vừa được quản trị viên đặt lại.',
          'Vui lòng liên hệ quản trị viên để nhận mật khẩu tạm và đổi lại mật khẩu ngay sau khi đăng nhập.',
        ],
      },
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

    // Luồng #13: Bắn chuông thông báo cho học viên khi được cộng thêm lượt chấm AI / Giảng viên
    notifyUser({
      userId,
      type: NotificationType.VIP_ACTIVATED,
      title: `Bạn vừa được cộng thêm ${input.aiQuota} lượt chấm AI`,
      message: `Quản trị viên đã cộng thêm ${input.aiQuota} lượt chấm AI${input.teacherQuota ? ` và ${input.teacherQuota} lượt chấm Giảng viên` : ''}. Tổng lượt AI hiện có: ${updated.ai_quota_left} lượt.`,
      link: '/thi-thu',
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

  async listExams(
    page: number = 1,
    limit: number = 50,
    skill?: string,
    search?: string,
    partNumber?: number,
    hotLevel?: string
  ) {
    try {
      await ensureTwentyFullTestExams(prisma);
    } catch {}
    const skip = (page - 1) * limit;
    const where: any = {};
    if (skill && skill !== 'ALL') {
      where.skill = skill;
    }
    if (hotLevel && hotLevel !== 'ALL') {
      if (hotLevel === 'HOT_ALL') {
        where.hot_level = { gt: 0 };
      } else if (hotLevel === 'HOT_5') {
        where.hot_level = 5;
      } else if (hotLevel === 'HOT_4') {
        where.hot_level = 4;
      } else if (hotLevel === 'HOT_3') {
        where.hot_level = 3;
      } else if (hotLevel === 'HOT_2') {
        where.hot_level = 2;
      } else if (hotLevel === 'HOT_1') {
        where.hot_level = 1;
      } else if (hotLevel === 'HOT_0') {
        where.OR = [{ hot_level: null }, { hot_level: 0 }];
      }
    }
    const rawTerm = search ? search.trim() : "";
    const uuidMatch = rawTerm.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const extractedUuid = uuidMatch ? uuidMatch[0] : null;

    if (extractedUuid) {
      // 1. Direct exact UUID/Link lookup: Prioritize finding this exact exam regardless of active skill/part filter
      where.OR = [
        { id: extractedUuid },
        { parts: { some: { id: extractedUuid } } },
        { parts: { some: { questions: { some: { id: extractedUuid } } } } },
      ];
    } else {
      // 2. Standard Filter by Skill
      if (skill && skill !== 'ALL') {
        where.skill = skill;
      }

      // 3. Smart Part Filter (handles both bundled 4-part exams and standalone single-part exams)
      if (partNumber) {
        where.parts = {
          some: this.buildPartFilterCondition(Number(partNumber)),
        };
      }

      // 4. Keyword / Topic / Number Search
      if (rawTerm) {
        const orConditions: any[] = [];

        orConditions.push(
          { title: { contains: rawTerm, mode: 'insensitive' } },
          { description: { contains: rawTerm, mode: 'insensitive' } }
        );

        // Cleaned term without dashes (handles em-dash '—' vs hyphen '-')
        const cleaned = rawTerm.replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned !== rawTerm) {
          orConditions.push({ title: { contains: cleaned, mode: 'insensitive' } });
        }

        // Exact & word-boundary number match (e.g. "04", "Đề 04", "4" -> matches "Đề 04", "Đề 4 ", "Đề 4 -", etc.)
        const numMatch = rawTerm.match(/^(?:đề|de|test|exam)?\s*0*(\d+)$/i);
        if (numMatch && numMatch[1]) {
          const num = numMatch[1];
          const paddedNum = num.padStart(2, '0');
          const padded3 = num.padStart(3, '0');
          orConditions.push(
            { title: { contains: `Đề ${paddedNum}`, mode: 'insensitive' } },
            { title: { contains: `Đề ${padded3}`, mode: 'insensitive' } },
            { title: { contains: `Đề ${num} `, mode: 'insensitive' } },
            { title: { contains: `Đề ${num} -`, mode: 'insensitive' } },
            { title: { contains: `Đề ${num} —`, mode: 'insensitive' } },
            { title: { contains: `Đề ${num}:`, mode: 'insensitive' } },
            { title: { equals: `Đề ${num}`, mode: 'insensitive' } }
          );
        }

        // Meaningful word tokens
        const words = rawTerm
          .split(/[—–\s,]+/)
          .map(w => w.trim())
          .filter(w => w.length >= 2 && !/^(đề|the|and|for|part|câu|bài)$/i.test(w));

        // Exact phrase deep search in parts & questions
        orConditions.push({
          parts: {
            some: {
              OR: [
                { title: { contains: rawTerm, mode: 'insensitive' } },
                { passage_text: { contains: rawTerm, mode: 'insensitive' } },
                { image_url: { contains: rawTerm, mode: 'insensitive' } },
                {
                  questions: {
                    some: {
                      OR: [
                        { prompt: { contains: rawTerm, mode: 'insensitive' } },
                        { explanation: { contains: rawTerm, mode: 'insensitive' } },
                        { correct_answer: { contains: rawTerm, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        });

        // Multi-word search: all words must match (AND) to prevent returning entire database
        if (words.length > 1) {
          orConditions.push({
            AND: words.map(w => ({
              OR: [
                { title: { contains: w, mode: 'insensitive' } },
                { description: { contains: w, mode: 'insensitive' } },
                { parts: { some: { title: { contains: w, mode: 'insensitive' } } } },
                { parts: { some: { passage_text: { contains: w, mode: 'insensitive' } } } },
                { parts: { some: { questions: { some: { prompt: { contains: w, mode: 'insensitive' } } } } } },
              ],
            })),
          });
        } else if (words.length === 1) {
          const w = words[0];
          orConditions.push(
            { title: { contains: w, mode: 'insensitive' } },
            { parts: { some: { title: { contains: w, mode: 'insensitive' } } } }
          );
        }

        if (where.OR && Array.isArray(where.OR)) {
          where.AND = [{ OR: where.OR }, { OR: orConditions }];
          delete where.OR;
        } else {
          where.OR = orConditions;
        }
      }
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hot_level: 'desc' }, { created_at: 'desc' }],
        include: {
          parts: {
            orderBy: { part_number: 'asc' },
            select: {
              id: true,
              part_number: true,
              title: true,
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
        hotLevel: exam.hot_level ?? 0,
        forecastTag: exam.forecast_tag ?? null,
        source: exam.source,
        createdAt: exam.created_at,
        partsCount: exam.parts.length,
        questionsCount: totalQuestions,
        attemptsCount: exam._count.submissions,
        parts: exam.parts.map((p) => ({
          id: p.id,
          partNumber: this.resolveLogicalPartNumber(p.part_number, p.title, exam.title),
          title: p.title,
          questionsCount: p._count.questions,
        })),
      };
    });

    return {
      exams: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Builds a strict Prisma filter for ExamPart by logical Aptis Part (1..4).
   * Prevents standalone single-part exams (where part_number = 1 in DB, but title says "Part 2/3/4")
   * from leaking into Part 1 or mismatching sequential part_number rows.
   */
  private buildPartFilterCondition(partNumber: number): any {
    const pNum = Number(partNumber);
    const otherNums = [1, 2, 3, 4, 5].filter((n) => n !== pNum);

    const otherPartTitlePatterns = otherNums.flatMap((n) => [
      { title: { contains: `Part ${n}`, mode: 'insensitive' as const } },
      { title: { contains: `Phần ${n}`, mode: 'insensitive' as const } },
      { title: { contains: `Part${n}`, mode: 'insensitive' as const } },
      { exam: { title: { contains: `Part ${n}`, mode: 'insensitive' as const } } },
      { exam: { title: { contains: `Phần ${n}`, mode: 'insensitive' as const } } },
    ]);

    return {
      OR: [
        { title: { contains: `Part ${pNum}`, mode: 'insensitive' as const } },
        { title: { contains: `Phần ${pNum}`, mode: 'insensitive' as const } },
        { title: { contains: `Part${pNum}`, mode: 'insensitive' as const } },
        {
          AND: [
            {
              OR: [
                { exam: { title: { contains: `Part ${pNum}`, mode: 'insensitive' as const } } },
                { exam: { title: { contains: `Phần ${pNum}`, mode: 'insensitive' as const } } },
              ],
            },
            {
              NOT: {
                OR: otherNums.flatMap((n) => [
                  { title: { contains: `Part ${n}`, mode: 'insensitive' as const } },
                  { title: { contains: `Phần ${n}`, mode: 'insensitive' as const } },
                  { title: { contains: `Part${n}`, mode: 'insensitive' as const } },
                ]),
              },
            },
          ],
        },
        {
          AND: [
            { part_number: pNum },
            {
              NOT: {
                OR: otherPartTitlePatterns,
              },
            },
          ],
        },
      ],
    };
  }

  private resolveLogicalPartNumber(
    partNumber: number,
    partTitle?: string | null,
    examTitle?: string | null
  ): number {
    const mPart = (partTitle || '').match(/(?:part|phần)\s*([1-4])/i);
    if (mPart) return Number(mPart[1]);
    const mExam = (examTitle || '').match(/(?:part|phần)\s*([1-4])/i);
    if (mExam) return Number(mExam[1]);
    return partNumber;
  }

  // ──────────────────────────────────────────────────────────────
  // CONTENT SEARCH: Search & Filter Questions across database
  // ──────────────────────────────────────────────────────────────
  async searchQuestions(params: {
    page?: number;
    limit?: number;
    search?: string;
    skill?: string;
    partNumber?: number;
    questionType?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    const partConditions: any[] = [];

    if (params.skill && params.skill !== 'ALL') {
      partConditions.push({ exam: { skill: params.skill } });
    }
    if (params.partNumber) {
      partConditions.push(this.buildPartFilterCondition(Number(params.partNumber)));
    }
    if (partConditions.length === 1) {
      where.part = partConditions[0];
    } else if (partConditions.length > 1) {
      where.part = { AND: partConditions };
    }

    if (params.questionType && params.questionType !== 'ALL') {
      where.question_type = params.questionType;
    }

    if (params.search && params.search.trim()) {
      const rawTerm = params.search.trim();
      const uuidMatch = rawTerm.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const extractedUuid = uuidMatch ? uuidMatch[0] : null;
      const orConditions: any[] = [];

      if (extractedUuid) {
        // Bypass strict part/skill filters if directly searching by UUID/URL
        delete where.part;
        orConditions.push(
          { id: extractedUuid },
          { part_id: extractedUuid },
          { part: { exam_id: extractedUuid } }
        );

        // Check if URL has ?part=N
        const urlPartMatch = rawTerm.match(/[?&]part=(\d+)/i);
        if (urlPartMatch) {
          const pNum = Number(urlPartMatch[1]);
          orConditions.push({
            part: {
              AND: [
                { exam_id: extractedUuid },
                this.buildPartFilterCondition(pNum),
              ],
            },
          });
        }
      }

      orConditions.push(
        { prompt: { contains: rawTerm, mode: 'insensitive' } },
        { explanation: { contains: rawTerm, mode: 'insensitive' } },
        { correct_answer: { contains: rawTerm, mode: 'insensitive' } },
        { part: { title: { contains: rawTerm, mode: 'insensitive' } } },
        { part: { passage_text: { contains: rawTerm, mode: 'insensitive' } } },
        { part: { image_url: { contains: rawTerm, mode: 'insensitive' } } },
        { part: { exam: { title: { contains: rawTerm, mode: 'insensitive' } } } }
      );

      // Smart exam number matching (e.g. "Đề 04", "Đề 4", "Exam 4")
      const deNumMatch = rawTerm.match(/(?:đề|de|test|exam)\s*0*(\d+)/i);
      if (deNumMatch) {
        const num = deNumMatch[1];
        const padded = num.padStart(2, '0');
        orConditions.push(
          { part: { exam: { title: { contains: `Đề ${padded}`, mode: 'insensitive' } } } },
          { part: { exam: { title: { contains: `Đề ${num}`, mode: 'insensitive' } } } },
          { part: { exam: { title: { contains: `Exam ${num}`, mode: 'insensitive' } } } }
        );
      }

      // Cleaned term without dashes
      const cleaned = rawTerm.replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned !== rawTerm) {
        orConditions.push(
          { prompt: { contains: cleaned, mode: 'insensitive' } },
          { part: { title: { contains: cleaned, mode: 'insensitive' } } },
          { part: { exam: { title: { contains: cleaned, mode: 'insensitive' } } } }
        );
      }

      // Word tokens
      const words = rawTerm
        .split(/[—–\s,]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2 && !/^(đề|the|and|for|part|câu|bài)$/i.test(w));

      if (words.length > 1) {
        orConditions.push({
          AND: words.map(w => ({
            OR: [
              { prompt: { contains: w, mode: 'insensitive' } },
              { explanation: { contains: w, mode: 'insensitive' } },
              { correct_answer: { contains: w, mode: 'insensitive' } },
              { part: { title: { contains: w, mode: 'insensitive' } } },
              { part: { passage_text: { contains: w, mode: 'insensitive' } } },
              { part: { exam: { title: { contains: w, mode: 'insensitive' } } } },
            ],
          })),
        });
      } else if (words.length === 1) {
        const w = words[0];
        orConditions.push(
          { prompt: { contains: w, mode: 'insensitive' } },
          { explanation: { contains: w, mode: 'insensitive' } },
          { part: { title: { contains: w, mode: 'insensitive' } } },
          { part: { exam: { title: { contains: w, mode: 'insensitive' } } } }
        );
      }

      where.OR = orConditions;
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ created_at: 'desc' }, { question_number: 'asc' }],
        include: {
          part: {
            select: {
              id: true,
              part_number: true,
              title: true,
              passage_text: true,
              audio_url: true,
              image_url: true,
              exam: {
                select: {
                  id: true,
                  title: true,
                  skill: true,
                  is_pro: true,
                  is_published: true,
                },
              },
            },
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    const formatted = questions.map((q) => ({
      id: q.id,
      partId: q.part_id,
      questionNumber: q.question_number,
      questionType: q.question_type,
      prompt: q.prompt,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      maxScore: q.max_score,
      createdAt: q.created_at,
      part: {
        id: q.part.id,
        partNumber: this.resolveLogicalPartNumber(q.part.part_number, q.part.title, q.part.exam?.title),
        title: q.part.title,
        passageText: q.part.passage_text,
        audioUrl: q.part.audio_url,
        imageUrl: q.part.image_url,
        exam: q.part.exam,
      },
    }));

    return {
      questions: formatted,
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

  async getDashboardKPIs(filter?: { period?: string; fromDate?: string; toDate?: string }) {
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
    } else if (period === 'week') {
      periodLabel = 'Tuần này (7 ngày)';
      rangeStart.setDate(now.getDate() - 6);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      periodLabel = 'Tháng này (30 ngày)';
      rangeStart.setDate(now.getDate() - 29);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      periodLabel = `Năm ${now.getFullYear()}`;
      rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'custom' && filter?.fromDate && filter?.toDate) {
      const [fy, fm, fd] = filter.fromDate.split('-').map(Number);
      const [ty, tm, td] = filter.toDate.split('-').map(Number);
      rangeStart = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
      rangeEnd = new Date(ty, tm - 1, td, 23, 59, 59, 999);
      periodLabel = `${filter.fromDate} → ${filter.toDate}`;
    } else if (period === 'all') {
      periodLabel = 'Toàn bộ thời gian';
      rangeStart = new Date(2020, 0, 1);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      // Default: 7 ngày qua
      rangeStart.setDate(now.getDate() - 6);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const startOfToday = new Date(now);
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
      // Thống kê trong kỳ lọc
      periodRevenueRes,
      periodAttempts,
      periodCompletedAttempts,
      periodNewUsers,
      periodPaidTxCount,
      periodAvgScoreRes,
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
      // Kỳ lọc
      prisma.transaction.aggregate({
        where: {
          status: TransactionStatus.COMPLETED,
          created_at: { gte: rangeStart, lte: rangeEnd },
        },
        _sum: { amount: true },
      }),
      prisma.examSubmission.count({
        where: { started_at: { gte: rangeStart, lte: rangeEnd } },
      }),
      prisma.examSubmission.count({
        where: {
          started_at: { gte: rangeStart, lte: rangeEnd },
          status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED] },
        },
      }),
      prisma.user.count({
        where: { created_at: { gte: rangeStart, lte: rangeEnd } },
      }),
      prisma.transaction.count({
        where: {
          status: TransactionStatus.COMPLETED,
          created_at: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      prisma.examSubmission.aggregate({
        where: {
          started_at: { gte: rangeStart, lte: rangeEnd },
          total_score: { not: null, gt: 0 },
        },
        _avg: { total_score: true },
      }),
    ]);

    // Xây dựng danh sách mốc thời gian động (Buckets) cho biểu đồ
    let buckets: Array<{ start: Date; end: Date; label: string; date: string }> = [];

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
    } else if (period === 'year') {
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
    } else {
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
      Promise.all(
        buckets.map(async (b) => {
          const count = await prisma.examSubmission.count({
            where: {
              started_at: { gte: b.start, lte: b.end },
            },
          });
          return {
            date: b.date,
            label: b.label,
            attempts: count,
          };
        })
      ),
      Promise.all(
        buckets.map(async (b) => {
          const rev = await prisma.transaction.aggregate({
            where: {
              status: TransactionStatus.COMPLETED,
              created_at: { gte: b.start, lte: b.end },
            },
            _sum: { amount: true },
          });
          return {
            date: b.date,
            label: b.label,
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
        take: 8,
        orderBy: { started_at: 'desc' },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          exam: { select: { id: true, title: true, skill: true } },
        },
      }),
      prisma.transaction.findMany({
        take: 8,
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

    const nowMs = Date.now();
    const getRelativeTimeString = (date: Date) => {
      const diffMs = nowMs - date.getTime();
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

  async exportDashboardReport(filter?: { period?: string; fromDate?: string; toDate?: string; format?: string }) {
    const kpis = await this.getDashboardKPIs(filter);
    const p = kpis.periodStats;

    // Tạo nội dung CSV chuẩn UTF-8 kèm BOM
    const lines: string[] = [];
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
  // ==========================================
  // QUẢN LÝ MÃ KHUYẾN MẠI & QUÀ TẶNG (PROMOTIONS)
  // ==========================================
  async listPromotions() {
    const list = await prisma.promotionCode.findMany({
      orderBy: [
        { is_featured: 'desc' },
        { is_active: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        plan: true,
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return list.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      codeType: p.code_type,
      planId: p.plan_id,
      planName: p.plan?.name || null,
      durationDays: p.duration_days,
      aiQuota: p.ai_quota,
      teacherQuota: p.teacher_quota,
      discountAmount: p.discount_amount,
      discountPercent: p.discount_percent,
      minOrderAmount: p.min_order_amount,
      isFeatured: p.is_featured,
      isActive: p.is_active,
      maxUses: p.max_uses,
      currentUses: p.current_uses,
      redemptionsCount: p._count.redemptions,
      startsAt: p.starts_at,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    }));
  }

  async createPromotion(input: AdminCreatePromotionInput, req?: Request) {
    const code = input.code.trim().toUpperCase();

    const existing = await prisma.promotionCode.findUnique({ where: { code } });
    if (existing) {
      throw { statusCode: 400, message: `Mã [${code}] đã tồn tại trong hệ thống. Vui lòng đặt mã khác.` };
    }

    const expiresAt = input.expires_at ? new Date(input.expires_at) : null;

    let createdPromo: any;
    if (input.is_featured) {
      // Cách 1: Hoán đổi độc quyền - Hạ toàn bộ các mã khác xuống, chỉ bật mã mới
      createdPromo = await prisma.$transaction(async (tx) => {
        await tx.promotionCode.updateMany({
          data: { is_featured: false },
        });

        return await tx.promotionCode.create({
          data: {
            code,
            title: input.title,
            description: input.description,
            code_type: input.code_type,
            plan_id: input.plan_id || null,
            duration_days: input.duration_days,
            ai_quota: input.ai_quota,
            teacher_quota: input.teacher_quota,
            discount_amount: input.discount_amount,
            discount_percent: input.discount_percent,
            min_order_amount: input.min_order_amount,
            is_featured: true,
            is_active: input.is_active,
            max_uses: input.max_uses || null,
            expires_at: expiresAt,
          },
          include: { plan: true },
        });
      });
    } else {
      createdPromo = await prisma.promotionCode.create({
        data: {
          code,
          title: input.title,
          description: input.description,
          code_type: input.code_type,
          plan_id: input.plan_id || null,
          duration_days: input.duration_days,
          ai_quota: input.ai_quota,
          teacher_quota: input.teacher_quota,
          discount_amount: input.discount_amount,
          discount_percent: input.discount_percent,
          min_order_amount: input.min_order_amount,
          is_featured: false,
          is_active: input.is_active,
          max_uses: input.max_uses || null,
          expires_at: expiresAt,
        },
        include: { plan: true },
      });
    }

    auditService.record({
      req,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'PROMOTION_CODE',
      entityId: createdPromo.id,
      description: `Admin tạo mã khuyến mại mới [${createdPromo.code}]: ${createdPromo.title} (Loại: ${createdPromo.code_type}, Treo Banner: ${createdPromo.is_featured ? 'Có' : 'Không'}).`,
      newValue: createdPromo,
    });

    return createdPromo;
  }

  async updatePromotion(id: string, input: AdminUpdatePromotionInput, req?: Request) {
    const promo = await prisma.promotionCode.findUnique({ where: { id } });
    if (!promo) {
      throw { statusCode: 404, message: 'Mã khuyến mại không tồn tại' };
    }

    const expiresAt = input.expires_at !== undefined ? (input.expires_at ? new Date(input.expires_at) : null) : undefined;

    let updated: any;
    if (input.is_featured === true) {
      // Cách 1: Hoán đổi độc quyền - Khi bật Treo Banner cho mã này, tự động hạ các mã khác xuống
      updated = await prisma.$transaction(async (tx) => {
        await tx.promotionCode.updateMany({
          where: { id: { not: id } },
          data: { is_featured: false },
        });

        return await tx.promotionCode.update({
          where: { id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.code_type !== undefined && { code_type: input.code_type }),
            ...(input.plan_id !== undefined && { plan_id: input.plan_id }),
            ...(input.duration_days !== undefined && { duration_days: input.duration_days }),
            ...(input.ai_quota !== undefined && { ai_quota: input.ai_quota }),
            ...(input.teacher_quota !== undefined && { teacher_quota: input.teacher_quota }),
            ...(input.discount_amount !== undefined && { discount_amount: input.discount_amount }),
            ...(input.discount_percent !== undefined && { discount_percent: input.discount_percent }),
            ...(input.min_order_amount !== undefined && { min_order_amount: input.min_order_amount }),
            ...(input.is_active !== undefined && { is_active: input.is_active }),
            is_featured: true,
            ...(input.max_uses !== undefined && { max_uses: input.max_uses }),
            ...(expiresAt !== undefined && { expires_at: expiresAt }),
          },
          include: { plan: true },
        });
      });
    } else {
      updated = await prisma.promotionCode.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.code_type !== undefined && { code_type: input.code_type }),
          ...(input.plan_id !== undefined && { plan_id: input.plan_id }),
          ...(input.duration_days !== undefined && { duration_days: input.duration_days }),
          ...(input.ai_quota !== undefined && { ai_quota: input.ai_quota }),
          ...(input.teacher_quota !== undefined && { teacher_quota: input.teacher_quota }),
          ...(input.discount_amount !== undefined && { discount_amount: input.discount_amount }),
          ...(input.discount_percent !== undefined && { discount_percent: input.discount_percent }),
          ...(input.min_order_amount !== undefined && { min_order_amount: input.min_order_amount }),
          ...(input.is_active !== undefined && { is_active: input.is_active }),
          ...(input.is_featured !== undefined && { is_featured: input.is_featured }),
          ...(input.max_uses !== undefined && { max_uses: input.max_uses }),
          ...(expiresAt !== undefined && { expires_at: expiresAt }),
        },
        include: { plan: true },
      });
    }

    auditService.record({
      req,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'PROMOTION_CODE',
      entityId: id,
      description: `Admin cập nhật mã khuyến mại [${promo.code}]: Trạng thái ${updated.is_active ? 'Bật' : 'Tắt'}, Treo Banner: ${updated.is_featured ? 'Có' : 'Không'}.`,
      oldValue: promo,
      newValue: updated,
    });

    return updated;
  }

  async deletePromotion(id: string, req?: Request) {
    const promo = await prisma.promotionCode.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!promo) {
      throw { statusCode: 404, message: 'Mã khuyến mại không tồn tại' };
    }

    if (promo._count.redemptions > 0) {
      await prisma.promotionCode.update({
        where: { id },
        data: { is_active: false, is_featured: false },
      });
      return { message: 'Mã đã có học viên sử dụng. Đã tự động tắt kích hoạt và hạ khỏi Banner.' };
    }

    await prisma.promotionCode.delete({ where: { id } });

    auditService.record({
      req,
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'PROMOTION_CODE',
      entityId: id,
      description: `Admin xóa mã khuyến mại [${promo.code}].`,
    });

    return { message: 'Đã xóa mã khuyến mại thành công' };
  }

  async listPromotionRedemptions(id: string) {
    const promo = await prisma.promotionCode.findUnique({
      where: { id },
      select: { code: true, title: true },
    });
    if (!promo) {
      throw { statusCode: 404, message: 'Mã khuyến mại không tồn tại' };
    }

    const redemptions = await prisma.promotionRedemption.findMany({
      where: { code_id: id },
      orderBy: { redeemed_at: 'desc' },
      include: {
        user: {
          select: { id: true, full_name: true, email: true, phone_number: true },
        },
        subscription: {
          select: { id: true, start_date: true, end_date: true, ai_quota_left: true },
        },
      },
    });

    return {
      promo,
      totalRedemptions: redemptions.length,
      redemptions: redemptions.map((r: any) => ({
        id: r.id,
        user: r.user,
        subscription: r.subscription,
        redeemedAt: r.redeemed_at,
      })),
    };
  }

}

export const adminService = new AdminService();
