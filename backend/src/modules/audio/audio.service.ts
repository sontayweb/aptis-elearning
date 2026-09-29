import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { Response } from 'express';

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || './uploads');

export class AudioService {
  async saveSubmissionAudio(
    userId: string,
    submissionId: string,
    questionId: string,
    file: Express.Multer.File,
    durationSeconds?: number
  ) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.user_id !== userId) {
      throw { statusCode: 404, message: 'Bài làm không tồn tại hoặc không thuộc quyền sở hữu' };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const targetDir = path.join(UPLOAD_ROOT, 'audio', 'submissions', String(year), month, submissionId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.webm';
    const filename = `q_${questionId}${ext}`;
    const destinationPath = path.join(targetDir, filename);

    fs.copyFileSync(file.path, destinationPath);
    try {
      fs.unlinkSync(file.path);
    } catch {
      // ignore
    }

    const relativeAudioUrl = `/api/submissions/${submissionId}/audio/${questionId}`;

    const answer = await prisma.submissionAnswer.upsert({
      where: {
        submission_id_question_id: {
          submission_id: submissionId,
          question_id: questionId,
        },
      },
      update: {
        audio_url: relativeAudioUrl,
        audio_mime_type: file.mimetype,
        audio_size_bytes: file.size,
        audio_duration: durationSeconds || Math.round(file.size / 16000), // ước tính nếu chưa truyền
      },
      create: {
        submission_id: submissionId,
        question_id: questionId,
        audio_url: relativeAudioUrl,
        audio_mime_type: file.mimetype,
        audio_size_bytes: file.size,
        audio_duration: durationSeconds || Math.round(file.size / 16000),
      },
    });

    return {
      answerId: answer.id,
      audioUrl: answer.audio_url,
      audioDuration: answer.audio_duration,
      saved: true,
    };
  }

  getPhysicalFilePath(submissionId: string, questionId: string, createdAt?: Date): string | null {
    const date = createdAt || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const targetDir = path.join(UPLOAD_ROOT, 'audio', 'submissions', String(year), month, submissionId);
    const commonExts = ['.webm', '.mp4', '.wav', '.m4a', '.aac', '.ogg'];
    for (const ext of commonExts) {
      const candidate = path.join(targetDir, `q_${questionId}${ext}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    const submissionsBase = path.join(UPLOAD_ROOT, 'audio', 'submissions');
    if (fs.existsSync(submissionsBase)) {
      const findInDir = (dir: string): string | null => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === submissionId) {
              for (const ext of commonExts) {
                const candidate = path.join(fullPath, `q_${questionId}${ext}`);
                if (fs.existsSync(candidate)) return candidate;
              }
            }
            const found = findInDir(fullPath);
            if (found) return found;
          }
        }
        return null;
      };
      return findInDir(submissionsBase);
    }
    return null;
  }

  async streamSubmissionAudio(
    submissionId: string,
    questionId: string,
    reqHeaders: any,
    res: Response,
    userId: string,
    userRole?: string
  ) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        answers: {
          where: { question_id: questionId },
        },
      },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Phiên làm bài thi không tồn tại' });
      return;
    }

    // Kiểm tra quyền truy cập: Chính chủ thí sinh HOẶC Giáo viên / Quản trị viên
    if (submission.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      res.status(403).json({ success: false, message: 'Bạn không có quyền nghe bản ghi âm này' });
      return;
    }

    const answer = submission.answers[0];
    if (!answer || !answer.audio_url) {
      res.status(404).json({ success: false, message: 'Chưa có bản ghi âm cho câu hỏi này' });
      return;
    }

    const createdAt = answer.created_at || submission.started_at || new Date();
    const resolvedFilePath = this.getPhysicalFilePath(submissionId, questionId, createdAt);

    if (!resolvedFilePath || !fs.existsSync(resolvedFilePath)) {
      res.status(404).json({ success: false, message: 'Tệp âm thanh vật lý không tìm thấy trên máy chủ' });
      return;
    }

    const mimeType = answer.audio_mime_type || 'audio/webm';
    this.streamAudio(resolvedFilePath, reqHeaders, res, mimeType);
  }

  streamAudio(filePath: string, reqHeaders: any, res: Response, mimeType: string = 'audio/webm') {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File âm thanh không tồn tại' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = reqHeaders.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

export const audioService = new AudioService();
