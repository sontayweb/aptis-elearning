import { Request, Response, NextFunction } from 'express';
import { vocabService } from './vocab.service';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';
import { z } from 'zod';

const notebookSchema = z.object({
  wordId: z.string().uuid(),
});

const toggleMemorizedSchema = z.object({
  isMemorized: z.boolean(),
});

export class VocabController {
  async getSets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sets = await vocabService.getSets();
      sendSuccess(res, sets, 'Lấy danh sách bộ từ vựng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSetWords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const setId = req.params.id;
      const set = await vocabService.getSetWords(setId);
      sendSuccess(res, set, 'Lấy danh sách từ vựng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async addToNotebook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { wordId } = notebookSchema.parse(req.body);
      const item = await vocabService.addToNotebook(userId, wordId);
      sendSuccess(res, item, 'Đã thêm từ vào sổ tay cá nhân', 201);
    } catch (error) {
      next(error);
    }
  }

  async getNotebook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const notebook = await vocabService.getNotebook(userId);
      sendSuccess(res, notebook, 'Lấy sổ từ vựng cá nhân thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async toggleMemorized(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const wordId = req.params.wordId;
      const { isMemorized } = toggleMemorizedSchema.parse(req.body);
      const updated = await vocabService.toggleMemorized(userId, wordId, isMemorized);
      sendSuccess(res, updated, 'Cập nhật trạng thái ghi nhớ thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createSet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const set = await vocabService.createSet(req.body);
      sendSuccess(res, set, 'Tạo bộ từ vựng thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteSet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vocabService.deleteSet(req.params.id);
      sendSuccess(res, { success: true }, 'Xóa bộ từ vựng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const word = await vocabService.createWord(req.params.id, req.body);
      sendSuccess(res, word, 'Thêm từ vựng thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const word = await vocabService.updateWord(req.params.id, req.body);
      sendSuccess(res, word, 'Cập nhật từ vựng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vocabService.deleteWord(req.params.id);
      sendSuccess(res, { success: true }, 'Xóa từ vựng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async importWords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await vocabService.importWords(req.params.id, req.body.words || []);
      sendSuccess(res, result, `Đã nhập thành công ${result.count} từ vựng vào bộ`, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const vocabController = new VocabController();
