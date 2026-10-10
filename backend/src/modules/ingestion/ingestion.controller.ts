import { Request, Response, NextFunction } from 'express';
import { ingestionService } from './ingestion.service';
import path from 'path';

export class IngestionController {
  async scanDirectories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceRoot = path.resolve(__dirname, '../../../../');
      const readingDir = path.join(workspaceRoot, 'READING');
      const speakingDir = path.join(workspaceRoot, 'SPEAKING');

      const readingResults = await ingestionService.ingestReadingDirectory(readingDir);
      const speakingResults = await ingestionService.ingestSpeakingDirectory(speakingDir);

      res.status(200).json({
        success: true,
        message: 'Bóc tách và nạp dữ liệu thành công từ thư mục READING và SPEAKING.',
        data: {
          reading: readingResults,
          speaking: speakingResults,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createListeningTts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      const result = await ingestionService.ingestListeningSample(
        title || 'Đề Thi Thử Listening 01 – Kèm Audio Giọng Bản Ngữ Tự Động'
      );

      res.status(200).json({
        success: true,
        message: 'Tạo đề Listening và sinh file âm thanh (TTS) thành công.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async createWriting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clubTopic } = req.body;
      const result = await ingestionService.ingestWritingSample(clubTopic || 'Music & Arts Club');

      res.status(200).json({
        success: true,
        message: 'Tạo đề Writing chuẩn Aptis thành công.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ingestionController = new IngestionController();
