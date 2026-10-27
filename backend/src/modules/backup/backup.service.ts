import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { prisma } from '../../config/database';
import {
  DatabaseConfig,
  DatabaseStats,
  BackupItem,
  BackupResult,
  RestoreResult,
  CreateBackupOptions,
  TableStat,
} from './backup.types';

export class BackupService {
  private readonly backupRoot: string;
  private readonly sqlDir: string;
  private readonly jsonDir: string;
  private readonly defaultRetentionCount = 10;

  constructor() {
    this.backupRoot = path.resolve(process.cwd(), 'backups');
    this.sqlDir = path.join(this.backupRoot, 'sql');
    this.jsonDir = path.join(this.backupRoot, 'json');
    this.ensureDirectories();
  }

  /**
   * Đảm bảo cấu trúc thư mục lưu trữ backup luôn tồn tại
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.backupRoot)) {
      fs.mkdirSync(this.backupRoot, { recursive: true });
    }
    if (!fs.existsSync(this.sqlDir)) {
      fs.mkdirSync(this.sqlDir, { recursive: true });
    }
    if (!fs.existsSync(this.jsonDir)) {
      fs.mkdirSync(this.jsonDir, { recursive: true });
    }
  }

  /**
   * Phân tích chuỗi DATABASE_URL chuẩn PostgreSQL an toàn, không phỏng đoán
   */
  public parseDatabaseUrl(url?: string): DatabaseConfig {
    const rawUrl = url || process.env.DATABASE_URL || '';
    if (!rawUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    try {
      const parsed = new URL(rawUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 5432,
        user: decodeURIComponent(parsed.username || 'postgres'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname.replace(/^\//, '') || 'aptis_kytich_db',
        schema: parsed.searchParams.get('schema') || 'public',
      };
    } catch {
      // Fallback regex chuẩn cho chuỗi URL PostgreSQL
      const regex = /^postgres(?:ql)?:\/\/([^:]+)(?::([^@]+))?@([^:/]+)(?::(\d+))?\/([^?]+)(?:\?schema=(.+))?$/;
      const match = rawUrl.match(regex);
      if (!match) {
        throw new Error('Invalid DATABASE_URL format. Expected postgresql://user:pass@host:port/dbname');
      }

      return {
        user: decodeURIComponent(match[1] || 'postgres'),
        password: decodeURIComponent(match[2] || ''),
        host: match[3] || 'localhost',
        port: match[4] ? parseInt(match[4], 10) : 5432,
        database: match[5] || 'aptis_kytich_db',
        schema: match[6] || 'public',
      };
    }
  }

  /**
   * Lấy thống kê số lượng bản ghi thực tế của tất cả các bảng trong CSDL
   */
  public async getDatabaseStats(): Promise<DatabaseStats> {
    const config = this.parseDatabaseUrl();

    const safeCount = async (name: string, fn: () => Promise<number>): Promise<number> => {
      try {
        return await fn();
      } catch {
        return 0;
      }
    };

    const [
      users,
      exams,
      parts,
      questions,
      submissions,
      answers,
      lessons,
      sentences,
      plans,
      userSubs,
      transactions,
      settings,
      courses,
      vocabTopics,
      vocabItems,
      auditLogs,
    ] = await Promise.all([
      safeCount('User', () => prisma.user.count()),
      safeCount('Exam', () => prisma.exam.count()),
      safeCount('ExamPart', () => prisma.examPart.count()),
      safeCount('Question', () => prisma.question.count()),
      safeCount('ExamSubmission', () => prisma.examSubmission.count()),
      safeCount('SubmissionAnswer', () => prisma.submissionAnswer.count()),
      safeCount('DictationLesson', () => prisma.dictationLesson.count()),
      safeCount('DictationSentence', () => prisma.dictationSentence.count()),
      safeCount('SubscriptionPlan', () => prisma.subscriptionPlan.count()),
      safeCount('UserSubscription', () => prisma.userSubscription.count()),
      safeCount('Transaction', () => prisma.transaction.count()),
      safeCount('SystemSetting', () => prisma.systemSetting.count()),
      safeCount('Course', () => prisma.course.count()),
      safeCount('VocabSet', () => prisma.vocabSet.count()),
      safeCount('VocabWord', () => prisma.vocabWord.count()),
      safeCount('AuditLog', () => prisma.auditLog.count()),
    ]);

    const tables: TableStat[] = [
      { table: 'User', displayName: 'Người dùng & Học viên', count: users },
      { table: 'Exam', displayName: 'Bộ đề thi (Exams)', count: exams },
      { table: 'ExamPart', displayName: 'Phần thi (Parts 1 - 4)', count: parts },
      { table: 'Question', displayName: 'Câu hỏi & Tùy chọn', count: questions },
      { table: 'ExamSubmission', displayName: 'Lịch sử nộp bài thi', count: submissions },
      { table: 'SubmissionAnswer', displayName: 'Chi tiết câu trả lời', count: answers },
      { table: 'DictationLesson', displayName: 'Bài luyện Nghe chép chính tả', count: lessons },
      { table: 'DictationSentence', displayName: 'Câu luyện nghe chép', count: sentences },
      { table: 'SubscriptionPlan', displayName: 'Gói thành viên VIP', count: plans },
      { table: 'UserSubscription', displayName: 'Tài khoản VIP đang kích hoạt', count: userSubs },
      { table: 'Transaction', displayName: 'Giao dịch thanh toán SePay', count: transactions },
      { table: 'Course', displayName: 'Khóa học & Lớp học', count: courses },
      { table: 'VocabSet', displayName: 'Bộ chủ đề từ vựng', count: vocabTopics },
      { table: 'VocabWord', displayName: 'Từ vựng chi tiết', count: vocabItems },
      { table: 'SystemSetting', displayName: 'Cấu hình hệ thống', count: settings },
      { table: 'AuditLog', displayName: 'Nhật ký kiểm toán hệ thống', count: auditLogs },
    ];

    const totalRecords = tables.reduce((acc, t) => acc + t.count, 0);

    return {
      databaseName: config.database,
      host: config.host,
      port: config.port,
      tables,
      totalRecords,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Tạo bản sao lưu Physical SQL Dump (.sql) bằng công cụ pg_dump chuẩn
   */
  public async createSqlBackup(retentionCount = this.defaultRetentionCount): Promise<BackupResult> {
    const startTime = Date.now();
    this.ensureDirectories();
    const config = this.parseDatabaseUrl();

    const timestamp = this.getFormattedTimestamp();
    const filename = `backup_${config.database}_${timestamp}.sql`;
    const filepath = path.join(this.sqlDir, filename);

    const args = [
      '-h', config.host,
      '-p', String(config.port),
      '-U', config.user,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '-d', config.database,
      '-f', filepath,
    ];

    const env = {
      ...process.env,
      PGPASSWORD: config.password || '',
    };

    return new Promise((resolve, reject) => {
      const child = spawn('pg_dump', args, { env, shell: false });
      let stderrOutput = '';

      child.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      child.on('error', (err) => {
        reject(
          new Error(
            `Không thể thực thi pg_dump. Vui lòng đảm bảo PostgreSQL client tools đã được cài đặt và có trong PATH: ${err.message}`
          )
        );
      });

      child.on('close', async (code) => {
        const durationMs = Date.now() - startTime;
        if (code !== 0) {
          if (fs.existsSync(filepath)) {
            try {
              fs.unlinkSync(filepath);
            } catch {}
          }
          return reject(new Error(`pg_dump thất bại (mã thoát ${code}): ${stderrOutput}`));
        }

        if (!fs.existsSync(filepath)) {
          return reject(new Error('Tệp sao lưu không được tạo'));
        }

        const stat = fs.statSync(filepath);
        const sha256 = this.calculateFileHash(filepath);

        // Tự động dọn dẹp các bản backup cũ theo retention
        await this.cleanupOldBackups('sql', retentionCount);

        const backupItem: BackupItem = {
          id: filename,
          filename,
          filepath,
          type: 'sql',
          sizeBytes: stat.size,
          sizeFormatted: this.formatBytes(stat.size),
          createdAt: stat.mtime.toISOString(),
          sha256,
        };

        resolve({
          success: true,
          message: `Sao lưu SQL Dump thành công: ${filename} (${backupItem.sizeFormatted})`,
          backup: backupItem,
          durationMs,
        });
      });
    });
  }

  /**
   * Tạo bản sao lưu Logical JSON Snapshot theo từng bảng dữ liệu
   */
  public async createJsonSnapshot(retentionCount = this.defaultRetentionCount): Promise<BackupResult> {
    const startTime = Date.now();
    this.ensureDirectories();
    const config = this.parseDatabaseUrl();

    const timestamp = this.getFormattedTimestamp();
    const snapshotName = `snapshot_${config.database}_${timestamp}`;
    const targetDir = path.join(this.jsonDir, snapshotName);
    fs.mkdirSync(targetDir, { recursive: true });

    const safeExport = async (name: string, fn: () => Promise<any>): Promise<number> => {
      try {
        const data = await fn();
        const jsonPath = path.join(targetDir, `${name}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
        return Array.isArray(data) ? data.length : 1;
      } catch {
        return 0;
      }
    };

    const [
      usersCount,
      examsCount,
      partsCount,
      questionsCount,
      submissionsCount,
      lessonsCount,
      sentencesCount,
      plansCount,
      userSubsCount,
      transactionsCount,
      settingsCount,
    ] = await Promise.all([
      safeExport('users', () => prisma.user.findMany()),
      safeExport('exams', () => prisma.exam.findMany()),
      safeExport('exam_parts', () => prisma.examPart.findMany()),
      safeExport('questions', () => prisma.question.findMany()),
      safeExport('exam_submissions', () => prisma.examSubmission.findMany({ include: { answers: true } })),
      safeExport('dictation_lessons', () => prisma.dictationLesson.findMany({ include: { sentences: true } })),
      safeExport('dictation_sentences', () => prisma.dictationSentence.findMany()),
      safeExport('subscription_plans', () => prisma.subscriptionPlan.findMany()),
      safeExport('user_subscriptions', () => prisma.userSubscription.findMany()),
      safeExport('transactions', () => prisma.transaction.findMany()),
      safeExport('system_settings', () => prisma.systemSetting.findMany()),
    ]);

    const tablesSummary: Record<string, number> = {
      users: usersCount,
      exams: examsCount,
      exam_parts: partsCount,
      questions: questionsCount,
      exam_submissions: submissionsCount,
      dictation_lessons: lessonsCount,
      dictation_sentences: sentencesCount,
      subscription_plans: plansCount,
      user_subscriptions: userSubsCount,
      transactions: transactionsCount,
      system_settings: settingsCount,
    };

    const totalRecords = Object.values(tablesSummary).reduce((a, b) => a + b, 0);

    const manifest = {
      id: snapshotName,
      database: config.database,
      createdAt: new Date().toISOString(),
      tablesSummary,
      totalRecords,
    };

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // Tính tổng dung lượng thư mục snapshot
    const totalBytes = this.calculateDirectorySize(targetDir);
    const durationMs = Date.now() - startTime;

    // Dọn dẹp snapshot cũ
    await this.cleanupOldBackups('json', retentionCount);

    const backupItem: BackupItem = {
      id: snapshotName,
      filename: snapshotName,
      filepath: targetDir,
      type: 'json',
      sizeBytes: totalBytes,
      sizeFormatted: this.formatBytes(totalBytes),
      createdAt: new Date().toISOString(),
      metadata: {
        totalRecords,
        tablesSummary,
      },
    };

    return {
      success: true,
      message: `Sao lưu JSON Snapshot thành công: ${snapshotName} (${backupItem.sizeFormatted}, ${totalRecords} bản ghi)`,
      backup: backupItem,
      durationMs,
    };
  }

  /**
   * Tạo bản sao lưu toàn diện (cả SQL Dump và JSON Snapshot)
   */
  public async createFullBackup(options: CreateBackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const retention = options.retentionCount || this.defaultRetentionCount;

    const [sqlResult, jsonResult] = await Promise.all([
      this.createSqlBackup(retention),
      this.createJsonSnapshot(retention),
    ]);

    const durationMs = Date.now() - startTime;
    return {
      success: true,
      message: `Hoàn tất sao lưu toàn diện: SQL Dump (${sqlResult.backup?.sizeFormatted}) và JSON Snapshot (${jsonResult.backup?.sizeFormatted})`,
      backup: sqlResult.backup,
      durationMs,
    };
  }

  /**
   * Liệt kê tất cả các bản sao lưu có sẵn trong hệ thống (sắp xếp mới nhất lên đầu)
   */
  public async listBackups(): Promise<BackupItem[]> {
    this.ensureDirectories();
    const items: BackupItem[] = [];

    // 1. Quét file SQL Dump trong backups/sql
    if (fs.existsSync(this.sqlDir)) {
      const sqlFiles = fs.readdirSync(this.sqlDir).filter((f) => f.endsWith('.sql'));
      for (const f of sqlFiles) {
        const fullPath = path.join(this.sqlDir, f);
        try {
          const stat = fs.statSync(fullPath);
          items.push({
            id: f,
            filename: f,
            filepath: fullPath,
            type: 'sql',
            sizeBytes: stat.size,
            sizeFormatted: this.formatBytes(stat.size),
            createdAt: stat.mtime.toISOString(),
          });
        } catch {}
      }
    }

    // Quét thêm cả file sql trong thư mục backups gốc (nếu có từ trước)
    if (fs.existsSync(this.backupRoot)) {
      const rootSqlFiles = fs.readdirSync(this.backupRoot).filter((f) => f.endsWith('.sql'));
      for (const f of rootSqlFiles) {
        const fullPath = path.join(this.backupRoot, f);
        if (!items.some((i) => i.filename === f)) {
          try {
            const stat = fs.statSync(fullPath);
            items.push({
              id: f,
              filename: f,
              filepath: fullPath,
              type: 'sql',
              sizeBytes: stat.size,
              sizeFormatted: this.formatBytes(stat.size),
              createdAt: stat.mtime.toISOString(),
            });
          } catch {}
        }
      }
    }

    // 2. Quét các thư mục JSON Snapshot trong backups/json
    if (fs.existsSync(this.jsonDir)) {
      const jsonDirs = fs.readdirSync(this.jsonDir, { withFileTypes: true });
      for (const d of jsonDirs) {
        if (d.isDirectory()) {
          const dirPath = path.join(this.jsonDir, d.name);
          const manifestPath = path.join(dirPath, 'manifest.json');
          let metadata: any = undefined;
          let createdAt = new Date().toISOString();

          if (fs.existsSync(manifestPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
              createdAt = metadata.createdAt || createdAt;
            } catch {}
          } else {
            try {
              const stat = fs.statSync(dirPath);
              createdAt = stat.mtime.toISOString();
            } catch {}
          }

          const sizeBytes = this.calculateDirectorySize(dirPath);
          items.push({
            id: d.name,
            filename: d.name,
            filepath: dirPath,
            type: 'json',
            sizeBytes,
            sizeFormatted: this.formatBytes(sizeBytes),
            createdAt,
            metadata: metadata
              ? {
                  totalRecords: metadata.totalRecords,
                  tablesSummary: metadata.tablesSummary,
                }
              : undefined,
          });
        }
      }
    }

    // Sắp xếp theo ngày tạo mới nhất lên trước
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Khôi phục cơ sở dữ liệu từ tệp SQL Dump (.sql)
   */
  public async restoreSqlBackup(filename: string): Promise<RestoreResult> {
    const startTime = Date.now();
    const safeFilename = path.basename(filename);

    if (!safeFilename.endsWith('.sql')) {
      throw new Error('Chỉ chấp nhận tệp có định dạng .sql');
    }

    // Tìm tệp trong thư mục sql/ hoặc backups gốc
    let targetFile = path.join(this.sqlDir, safeFilename);
    if (!fs.existsSync(targetFile)) {
      targetFile = path.join(this.backupRoot, safeFilename);
    }

    if (!fs.existsSync(targetFile)) {
      throw new Error(`Không tìm thấy tệp sao lưu: ${safeFilename}`);
    }

    const config = this.parseDatabaseUrl();

    const args = [
      '-h', config.host,
      '-p', String(config.port),
      '-U', config.user,
      '-d', config.database,
      '-f', targetFile,
    ];

    const env = {
      ...process.env,
      PGPASSWORD: config.password || '',
    };

    return new Promise((resolve, reject) => {
      const child = spawn('psql', args, { env, shell: false });
      let output = '';
      let stderrOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      child.on('error', (err) => {
        reject(new Error(`Không thể khởi chạy psql: ${err.message}`));
      });

      child.on('close', (code) => {
        const durationMs = Date.now() - startTime;
        // psql có thể xuất thông báo NOTICE hoặc WARNING qua stderr dù code = 0
        if (code !== 0) {
          return reject(new Error(`Khôi phục database thất bại (mã thoát ${code}): ${stderrOutput}`));
        }

        resolve({
          success: true,
          message: `Khôi phục cơ sở dữ liệu ${config.database} từ tệp ${safeFilename} thành công trong ${(durationMs / 1000).toFixed(2)}s!`,
          filename: safeFilename,
          durationMs,
          output: stderrOutput || output,
        });
      });
    });
  }

  /**
   * Xóa một bản sao lưu (file SQL hoặc thư mục JSON)
   */
  public async deleteBackup(filename: string): Promise<boolean> {
    const safeName = path.basename(filename);

    // Kiểm tra trong sqlDir
    const sqlPath = path.join(this.sqlDir, safeName);
    if (fs.existsSync(sqlPath)) {
      fs.unlinkSync(sqlPath);
      return true;
    }

    // Kiểm tra trong backupRoot
    const rootSqlPath = path.join(this.backupRoot, safeName);
    if (fs.existsSync(rootSqlPath)) {
      fs.unlinkSync(rootSqlPath);
      return true;
    }

    // Kiểm tra trong jsonDir
    const jsonPath = path.join(this.jsonDir, safeName);
    if (fs.existsSync(jsonPath)) {
      fs.rmSync(jsonPath, { recursive: true, force: true });
      return true;
    }

    return false;
  }

  /**
   * Lấy đường dẫn tệp sao lưu an toàn để tải xuống
   */
  public getDownloadPath(filename: string): string | null {
    const safeName = path.basename(filename);

    const candidates = [
      path.join(this.sqlDir, safeName),
      path.join(this.backupRoot, safeName),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        return c;
      }
    }

    return null;
  }

  /**
   * Tự động dọn dẹp các bản backup cũ vượt quá giới hạn retention
   */
  private async cleanupOldBackups(type: 'sql' | 'json', keepCount: number): Promise<number> {
    try {
      if (type === 'sql') {
        const files = fs
          .readdirSync(this.sqlDir)
          .filter((f) => f.endsWith('.sql'))
          .map((f) => {
            const p = path.join(this.sqlDir, f);
            return { name: f, path: p, time: fs.statSync(p).mtime.getTime() };
          })
          .sort((a, b) => b.time - a.time);

        if (files.length > keepCount) {
          const toDelete = files.slice(keepCount);
          for (const item of toDelete) {
            try {
              fs.unlinkSync(item.path);
            } catch {}
          }
          return toDelete.length;
        }
      } else {
        const dirs = fs
          .readdirSync(this.jsonDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => {
            const p = path.join(this.jsonDir, d.name);
            return { name: d.name, path: p, time: fs.statSync(p).mtime.getTime() };
          })
          .sort((a, b) => b.time - a.time);

        if (dirs.length > keepCount) {
          const toDelete = dirs.slice(keepCount);
          for (const item of toDelete) {
            try {
              fs.rmSync(item.path, { recursive: true, force: true });
            } catch {}
          }
          return toDelete.length;
        }
      }
    } catch {}

    return 0;
  }

  /**
   * Tính mã băm SHA-256 của tệp
   */
  private calculateFileHash(filepath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filepath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Tính tổng kích thước thư mục theo byte
   */
  private calculateDirectorySize(dirPath: string): number {
    let size = 0;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          size += this.calculateDirectorySize(filePath);
        } else {
          size += stat.size;
        }
      }
    } catch {}
    return size;
  }

  /**
   * Định dạng dung lượng byte sang KB, MB, GB dễ đọc
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Định dạng timestamp cho tên file backup
   */
  private getFormattedTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
  }
}

export const backupService = new BackupService();
