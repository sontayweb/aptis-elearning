import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import {
  adminUserFilterSchema,
  adminCreateUserSchema,
  adminCreatePromotionSchema,
  adminUpdatePromotionSchema,
  adminUpdateUserStatusSchema,
  adminCreateExamSchema,
  adminResolveTransactionSchema,
  adminCreateManualTransactionSchema,
  adminGrantVipSchema,
  adminResetPasswordSchema,
  adminAdjustQuotaSchema,
} from './admin.dto';
import { sendSuccess } from '../../utils/api-response';
import { TransactionStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { standardExamParser } from '../ingestion/parsers/standard-exam.parser';
import { ttsAudioService } from '../ingestion/tts-audio.service';
import { topicTaggerService } from './topic-tagger.service';
import { speakingHintsGeneratorService } from './speaking-hints-generator.service';

export class AdminController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = adminUserFilterSchema.parse(req.query);
      const result = await adminService.listUsers(filter);
      sendSuccess(res, result.users, 'Lấy danh sách người dùng thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateUserSchema.parse(req.body);
      const user = await adminService.createUser(validatedInput, req);
      sendSuccess(res, user, 'Tạo tài khoản thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async bulkImportUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw { statusCode: 400, message: 'Vui lòng đính kèm tệp Excel (.xlsx, .csv)' };
      }
      const result = await adminService.bulkImportUsers(req.file.buffer, req);
      sendSuccess(res, result, 'Xử lý nhập học viên hàng loạt thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const { isActive } = adminUpdateUserStatusSchema.parse(req.body);
      const updated = await adminService.updateUserStatus(userId, isActive, req);
      sendSuccess(res, updated, 'Cập nhật trạng thái người dùng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async grantVip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminGrantVipSchema.parse(req.body);
      const subscription = await adminService.grantVip(userId, validatedInput, req);
      sendSuccess(res, subscription, 'Cấp quyền VIP thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminResetPasswordSchema.parse(req.body);
      const result = await adminService.resetPassword(userId, validatedInput, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async adjustQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const validatedInput = adminAdjustQuotaSchema.parse(req.body);
      const result = await adminService.adjustQuota(userId, validatedInput, req);
      sendSuccess(res, result, 'Cộng thêm lượt chấm thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const summary = await adminService.getUserSummary(userId);
      sendSuccess(res, summary, 'Lấy thông tin tổng hợp học viên thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateExamSchema.parse(req.body);
      const exam = await adminService.createExam(validatedInput, req);
      sendSuccess(res, exam, 'Tạo đề thi mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const result = await adminService.deleteExam(examId, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const updated = await adminService.updateExam(examId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateHotLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { examIds, hotLevel, isPublished, skill, rules } = req.body || {};
      if (!examIds?.length && !rules?.length) {
        throw { statusCode: 400, message: 'Cần truyền examIds hoặc rules để gán độ hot hàng loạt.' };
      }
      const result = await adminService.bulkUpdateHotLevel(
        { examIds, hotLevel, isPublished, skill, rules },
        req
      );
      sendSuccess(res, result, `Đã cập nhật ${result.updated} đề thi`, 200);
    } catch (error) {
      next(error);
    }
  }

  async duplicateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const cloned = await adminService.duplicateExam(examId, req);
      sendSuccess(res, cloned, 'Nhân bản đề thi thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async rerandomizeFullTestExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const updated = await adminService.rerandomizeFullTestExam(examId, req);
      sendSuccess(res, updated, 'Đã trộn lại ngẫu nhiên bộ 16 Parts mới cho đề thi Full Test', 200);
    } catch (error) {
      next(error);
    }
  }

  async generateFullTestExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.generateFullTestExams(req);
      sendSuccess(res, result, 'Đã khởi tạo / khôi phục đủ 20 bộ đề Full Test (APT-01 đến APT-20)', 200);
    } catch (error) {
      next(error);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const status = req.query.status as TransactionStatus;
      const result = await adminService.listTransactions(page, limit, status);
      sendSuccess(res, result.transactions, 'Lấy danh sách giao dịch thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const txId = req.params.id;
      const validatedInput = adminResolveTransactionSchema.parse(req.body);
      const updated = await adminService.resolveTransaction(txId, validatedInput, req);
      sendSuccess(res, updated, 'Xử lý giao dịch thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createManualTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreateManualTransactionSchema.parse(req.body);
      const created = await adminService.createManualTransaction(validatedInput, req);
      sendSuccess(res, created, 'Tạo giao dịch nạp tiền thủ công và kích hoạt VIP thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as string | undefined;
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const kpis = await adminService.getDashboardKPIs({ period, fromDate, toDate });
      sendSuccess(res, kpis, 'Lấy chỉ số KPI Dashboard thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async exportDashboardReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as string | undefined;
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const format = (req.query.format as string) || 'csv';

      const csvContent = await adminService.exportDashboardReport({ period, fromDate, toDate, format });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="bao-cao-aptis-${period || 'custom'}-${Date.now()}.csv"`
      );
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 50);
      const skill = req.query.skill as string | undefined;
      const search = req.query.search as string | undefined;
      const partNumber = req.query.partNumber ? Number(req.query.partNumber) : undefined;
      const hotLevel = req.query.hotLevel as string | undefined;
      const result = await adminService.listExams(page, limit, skill, search, partNumber, hotLevel);
      sendSuccess(res, result.exams, 'Lấy danh sách đề thi thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const search = req.query.search as string | undefined;
      const skill = req.query.skill as string | undefined;
      const partNumber = req.query.partNumber ? Number(req.query.partNumber) : undefined;
      const questionType = req.query.questionType as string | undefined;

      const result = await adminService.searchQuestions({
        page,
        limit,
        search,
        skill,
        partNumber,
        questionType,
      });

      sendSuccess(res, result.questions, 'Tìm kiếm câu hỏi thành công', 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await adminService.listPlans();
      sendSuccess(res, plans, 'Lấy danh sách gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planId = req.params.id;
      const updated = await adminService.updatePlan(planId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật gói cước thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  // ── CONTENT EDITOR CONTROLLERS ─────────────────────────────────

  async getExamFull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const exam = await adminService.getExamFull(examId);
      sendSuccess(res, exam, 'Lấy nội dung đầy đủ đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const updated = await adminService.updatePart(partId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật phần thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async addPart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.id;
      const part = await adminService.addPart(examId, req.body, req);
      sendSuccess(res, part, 'Thêm phần thi mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deletePart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const result = await adminService.deletePart(partId, req);
      sendSuccess(res, result, 'Xóa phần thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const updated = await adminService.updateQuestion(questionId, req.body, req);
      sendSuccess(res, updated, 'Cập nhật câu hỏi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const question = await adminService.addQuestion(partId, req.body, req);
      sendSuccess(res, question, 'Thêm câu hỏi thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const result = await adminService.deleteQuestion(questionId, req);
      sendSuccess(res, result, 'Xóa câu hỏi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async generateSpeakingHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId;
      const hints = await speakingHintsGeneratorService.generateForQuestion(questionId);
      sendSuccess(res, hints, 'Sinh gợi ý Speaking thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSpeakingHintsOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await speakingHintsGeneratorService.getOverview();
      sendSuccess(res, data, 'Lay danh sach tong quan tranh Speaking thanh cong', 200);
    } catch (error) {
      next(error);
    }
  }

  async generatePartSpeakingHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const hints = await speakingHintsGeneratorService.generateHintsForPart(partId);
      sendSuccess(res, hints, 'Sinh goi y tranh Speaking cho phan thi thanh cong', 200);
    } catch (error) {
      next(error);
    }
  }

  async savePartSpeakingHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partId = req.params.partId;
      const hints = req.body?.hints || req.body;
      if (!hints) {
        throw { statusCode: 400, message: 'Du lieu goi y khong hop le' };
      }
      await speakingHintsGeneratorService.saveHintsForPart(partId, hints);
      sendSuccess(res, { success: true }, 'Luu goi y Speaking cho phan thi thanh cong', 200);
    } catch (error) {
      next(error);
    }
  }

  async batchGenerateAllSpeakingHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skipExisting, skipBrokenImages, delayMs, partIds } = req.body || {};
      const result = await speakingHintsGeneratorService.batchGenerateAll({
        skipExisting: skipExisting !== undefined ? Boolean(skipExisting) : true,
        skipBrokenImages: skipBrokenImages !== undefined ? Boolean(skipBrokenImages) : true,
        delayMs: typeof delayMs === 'number' ? delayMs : 1500,
        partIds: Array.isArray(partIds) ? partIds : undefined,
      });
      sendSuccess(res, result, 'Hoan thanh tien trinh sinh goi y hang loat toan he thong', 200);
    } catch (error) {
      next(error);
    }
  }

  async batchGenerateSpeakingHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examId = req.params.examId;
      const result = await speakingHintsGeneratorService.batchGenerateForExam(examId);
      sendSuccess(res, result, 'Sinh gợi ý hàng loạt cho đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async validateImportExamFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw { statusCode: 400, message: 'Vui lòng đính kèm tập tin Word (.docx) hoặc Excel (.xlsx).' };
      }

      const originalName = req.file.originalname || 'upload_file';
      const ext = path.extname(originalName).toLowerCase();

      let validationResult;
      if (ext === '.docx') {
        validationResult = standardExamParser.parseAndValidateDocx(req.file.buffer, originalName);
      } else if (ext === '.xlsx' || ext === '.xls') {
        validationResult = standardExamParser.parseAndValidateExcel(req.file.buffer, originalName);
      } else {
        throw { statusCode: 400, message: 'Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .docx hoặc .xlsx.' };
      }

      sendSuccess(res, validationResult, 'Kiểm định tập tin đề thi thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async confirmImportExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exams } = req.body;
      if (!exams || !Array.isArray(exams) || exams.length === 0) {
        throw { statusCode: 400, message: 'Danh sách đề thi cần lưu không hợp lệ.' };
      }

      const creatorId = (req as any).user?.id;
      const result = await standardExamParser.saveExamsToDatabase(exams, creatorId);
      sendSuccess(res, result, `Lưu thành công ${result.count} đề thi vào hệ thống`, 201);
    } catch (error) {
      next(error);
    }
  }

  async getImportTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = [
        {
          name: 'Mẫu đề Speaking Part 2 & Part 3 (.docx)',
          description: 'Mẫu Word thuận tiện cho các bài thi miêu tả tranh và so sánh đối chiếu có bảng từ vựng song ngữ.',
          fileName: 'Mau_Nhap_De_Speaking_Part2_Part3.docx',
          downloadUrl: '/templates/Mau_Nhap_De_Speaking_Part2_Part3.docx',
          fileType: 'DOCX',
          size: '38 KB',
        },
        {
          name: 'Mẫu đề Writing 4 Parts (.docx)',
          description: 'Mẫu Word chuẩn cho bài thi Viết 4 phần: Điền form, Viết ngắn, Chat nhóm câu lạc bộ và Viết thư/Email.',
          fileName: 'Mau_Nhap_De_Writing.docx',
          downloadUrl: '/templates/Mau_Nhap_De_Writing.docx',
          fileType: 'DOCX',
          size: '36 KB',
        },
        {
          name: 'Mẫu đề Reading & Listening (.xlsx)',
          description: 'Mẫu bảng tính Excel nhanh cho bài đọc hiểu và trắc nghiệm câu hỏi nghe kèm đáp án và giải thích.',
          fileName: 'Mau_Nhap_De_Reading_Listening.xlsx',
          downloadUrl: '/templates/Mau_Nhap_De_Reading_Listening.xlsx',
          fileType: 'XLSX',
          size: '6 KB',
        },
      ];

      sendSuccess(res, templates, 'Lấy danh sách file mẫu thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async uploadExamImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        throw { statusCode: 400, message: 'Vui lòng đính kèm tệp hình ảnh (PNG, JPG, WEBP, GIF).' };
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw { statusCode: 400, message: 'Định dạng ảnh không hợp lệ. Hệ thống chỉ chấp nhận PNG, JPG, WEBP, GIF.' };
      }

      const category = (req.body.category || req.query.category || 'speaking')
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'exams', category || 'speaking');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname) || '.png';
      const safeOriginalName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const filename = `exam_${Date.now()}_${safeOriginalName}${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Tự động dọn dẹp ảnh cũ nếu đây là thao tác thay thế ảnh (tránh rác bộ nhớ server)
      const previousUrl = (req.body.previousUrl || req.body.oldUrl || req.query.previousUrl || '').toString().trim();
      if (previousUrl && previousUrl.startsWith('/uploads/exams/')) {
        adminService.safeDeleteExamImage(previousUrl);
      }

      const publicUrl = `/uploads/exams/${category || 'speaking'}/${filename}`;
      sendSuccess(
        res,
        {
          url: publicUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        'Tải ảnh lên máy chủ thành công',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExamImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const url = (req.body?.url || req.query?.url || '').toString().trim();
      if (!url) {
        throw { statusCode: 400, message: 'Vui lòng cung cấp đường dẫn ảnh cần xóa.' };
      }
      const deleted = adminService.safeDeleteExamImage(url);
      sendSuccess(
        res,
        { deleted, url },
        deleted ? 'Đã xóa ảnh thành công khỏi máy chủ' : 'Ảnh không tồn tại hoặc đã được xóa trước đó',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // Alias for backward compatibility with import flow
  async uploadImportImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.uploadExamImage(req, res, next);
  }

  // ── EXAM AUDIO & AI TTS GENERATION ─────────────────────────────
  async uploadExamAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw { statusCode: 400, message: 'Vui lòng đính kèm tệp âm thanh (MP3, WAV, M4A, OGG, WEBM).' };
      }

      const category = (req.body.category || req.query.category || 'listening')
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'audio', category || 'listening');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname) || '.mp3';
      const safeOriginalName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const filename = `audio_${Date.now()}_${safeOriginalName}${ext}`;
      const filePath = path.join(uploadDir, filename);

      if (req.file.buffer) {
        fs.writeFileSync(filePath, req.file.buffer);
      } else if (req.file.path) {
        fs.copyFileSync(req.file.path, filePath);
        try { fs.unlinkSync(req.file.path); } catch {}
      } else {
        throw { statusCode: 400, message: 'Không thể xử lý tệp âm thanh tải lên.' };
      }

      // Tự động dọn dẹp audio cũ nếu đây là thao tác thay thế audio (tránh rác bộ nhớ server)
      const previousUrl = (req.body.previousUrl || req.body.oldUrl || req.query.previousUrl || '').toString().trim();
      if (previousUrl && previousUrl.startsWith('/uploads/audio/')) {
        adminService.safeDeleteExamAudio(previousUrl);
      }

      const publicUrl = `/uploads/audio/${category || 'listening'}/${filename}`;
      sendSuccess(
        res,
        {
          url: publicUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        'Tải tệp âm thanh lên máy chủ thành công',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExamAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const url = (req.body?.url || req.query?.url || '').toString().trim();
      if (!url) {
        throw { statusCode: 400, message: 'Vui lòng cung cấp đường dẫn audio cần xóa.' };
      }
      const deleted = adminService.safeDeleteExamAudio(url);
      sendSuccess(
        res,
        { deleted, url },
        deleted ? 'Đã xóa audio thành công khỏi máy chủ' : 'Audio không tồn tại hoặc đã được xóa trước đó',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async generateAudioTts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, voice, prefix, previousUrl } = req.body;
      const cleanText = (text || '').toString().trim();
      if (!cleanText) {
        throw { statusCode: 400, message: 'Vui lòng cung cấp nội dung transcript / kịch bản để sinh giọng nói.' };
      }

      const safePrefix = (prefix || 'exam_listening').toString().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const chosenVoice = voice && voice !== 'auto' ? voice : undefined;

      const result = await ttsAudioService.generateSpeech(cleanText, safePrefix, {
        voice: chosenVoice,
      });

      // Nếu có previousUrl cũ, dọn dẹp an toàn
      if (previousUrl && typeof previousUrl === 'string' && previousUrl.startsWith('/uploads/audio/')) {
        adminService.safeDeleteExamAudio(previousUrl);
      }

      sendSuccess(
        res,
        {
          url: result.publicUrl,
          localPath: result.localPath,
        },
        'Sinh âm thanh bản ngữ từ kịch bản thành công',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── TOPIC TAGGING & AUTO-PROPAGATION ────────────────────────────
  async getTopicRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await topicTaggerService.getTopicRules();
      sendSuccess(res, rules, 'Lấy danh sách quy tắc chủ đề thành công');
    } catch (error) {
      next(error);
    }
  }

  async previewTopicMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keywords = req.body?.keywords || (req.query?.keywords ? String(req.query.keywords).split(',') : []);
      const skill = req.body?.skill || req.query?.skill;
      const result = await topicTaggerService.previewMatches(keywords, skill as string);
      sendSuccess(res, result, 'Xem trước danh sách đề thi khớp từ khóa');
    } catch (error) {
      next(error);
    }
  }

  async saveTopicRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const autoPropagate = Boolean(req.body?.autoPropagate);
      const result = await topicTaggerService.saveTopicRule(req.body, autoPropagate, req);
      sendSuccess(res, result, 'Lưu quy tắc chủ đề thành công');
    } catch (error) {
      next(error);
    }
  }

  async syncAllTopicRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await topicTaggerService.syncAllRules(req);
      sendSuccess(res, result, 'Đồng bộ toàn bộ quy tắc chủ đề vào Database thành công');
    } catch (error) {
      next(error);
    }
  }

  async deleteTopicRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleId = req.params.id;
      const resetHot = req.query?.reset === 'true';
      const result = await topicTaggerService.deleteTopicRule(ruleId, resetHot, req);
      sendSuccess(res, result, 'Xóa quy tắc chủ đề thành công');
    } catch (error) {
      next(error);
    }
  }
  async listPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listPromotions();
      sendSuccess(res, result, 'Lấy danh sách mã khuyến mại thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = adminCreatePromotionSchema.parse(req.body);
      const result = await adminService.createPromotion(validatedInput, req);
      sendSuccess(res, result, 'Tạo mã khuyến mại mới thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const validatedInput = adminUpdatePromotionSchema.parse(req.body);
      const result = await adminService.updatePromotion(id, validatedInput, req);
      sendSuccess(res, result, 'Cập nhật mã khuyến mại thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const result = await adminService.deletePromotion(id, req);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async listPromotionRedemptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const result = await adminService.listPromotionRedemptions(id);
      sendSuccess(res, result, 'Lấy danh sách học viên đã dùng mã thành công', 200);
    } catch (error) {
      next(error);
    }
  }

}

export const adminController = new AdminController();
