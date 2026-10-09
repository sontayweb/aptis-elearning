import { Request, Response, NextFunction } from 'express';
import { cmsService } from './cms.service';
import { sendSuccess } from '../../utils/api-response';

export class CmsController {
  async getPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug;
      const page = await cmsService.getPage(slug);
      sendSuccess(res, page, 'Lấy thông tin trang thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await cmsService.getReviews();
      sendSuccess(res, reviews, 'Lấy danh sách đánh giá thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedFeedbacks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getFeaturedFeedbacks();
      sendSuccess(res, data, 'Lấy danh sách feedback nổi bật thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getHallOfFame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hof = await cmsService.getHallOfFame();
      sendSuccess(res, hof, 'Lấy Bảng Kỳ Tích thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw { statusCode: 401, message: 'Vui lòng đăng nhập để gửi đánh giá' };
      }
      const review = await cmsService.createReview(userId, req.body);
      sendSuccess(
        res,
        review,
        'Gửi đánh giá bài thi thành công. Bài đánh giá sẽ được kiểm duyệt và thưởng lượt AI!',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewId = req.params.id;
      const { isApproved, teacherNote, status, rewardQuota } = req.body;
      const result = await cmsService.updateReview(
        reviewId,
        { isApproved, teacherNote, status, rewardQuota },
        req
      );
      sendSuccess(res, result, 'Cập nhật đánh giá thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async approveReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewId = req.params.id;
      const { teacherNote, rewardQuota } = req.body;
      const result = await cmsService.updateReview(
        reviewId,
        { isApproved: true, teacherNote, rewardQuota: rewardQuota ?? 5 },
        req
      );
      sendSuccess(res, result, 'Duyệt bài đánh giá và kích hoạt thưởng thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewId = req.params.id;
      const result = await cmsService.deleteReview(reviewId);
      sendSuccess(res, result, 'Xóa đánh giá thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const cmsController = new CmsController();
