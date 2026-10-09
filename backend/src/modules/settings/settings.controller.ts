import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { updateSettingsSchema } from './settings.dto';
import { sendSuccess, sendError } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class SettingsController {
  /**
   * GET /api/settings/public
   * Lấy cấu hình công khai (Zalo URL, Hotline, Fanpage)
   */
  async getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await settingsService.getPublicSettings();
      // Set HTTP Cache header
      res.setHeader('Cache-Control', 'public, max-age=600');
      sendSuccess(res, data, 'Lấy cấu hình hệ thống thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settings (ADMIN)
   * Lấy toàn bộ cấu hình hệ thống
   */
  async getAllSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getAllSettings();
      sendSuccess(res, settings, 'Lấy danh sách cấu hình quản trị thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/settings (ADMIN)
   * Cập nhật danh sách cấu hình hệ thống
   */
  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateSettingsSchema.parse(req.body);
      const adminId = req.user!.userId;

      const result = await settingsService.updateSettings(adminId, validated, req);
      sendSuccess(res, result, 'Cập nhật cấu hình hệ thống thành công', 200);
    } catch (error: any) {
      if (error?.errors) {
        sendError(res, error.errors[0]?.message || 'Dữ liệu cấu hình không hợp lệ', 400, error.errors);
        return;
      }
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
