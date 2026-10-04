"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsController = exports.CmsController = void 0;
const cms_service_1 = require("./cms.service");
const api_response_1 = require("../../utils/api-response");
class CmsController {
    async getPage(req, res, next) {
        try {
            const slug = req.params.slug;
            const page = await cms_service_1.cmsService.getPage(slug);
            (0, api_response_1.sendSuccess)(res, page, 'Lấy thông tin trang thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getReviews(req, res, next) {
        try {
            const reviews = await cms_service_1.cmsService.getReviews();
            (0, api_response_1.sendSuccess)(res, reviews, 'Lấy danh sách đánh giá thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getHallOfFame(req, res, next) {
        try {
            const hof = await cms_service_1.cmsService.getHallOfFame();
            (0, api_response_1.sendSuccess)(res, hof, 'Lấy Bảng Kỳ Tích thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createReview(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw { statusCode: 401, message: 'Vui lòng đăng nhập để gửi đánh giá' };
            }
            const review = await cms_service_1.cmsService.createReview(userId, req.body);
            (0, api_response_1.sendSuccess)(res, review, 'Gửi đánh giá bài thi thành công. Bài đánh giá sẽ được kiểm duyệt và thưởng lượt AI!', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async updateReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const { isApproved, teacherNote, status, rewardQuota } = req.body;
            const result = await cms_service_1.cmsService.updateReview(reviewId, { isApproved, teacherNote, status, rewardQuota }, req);
            (0, api_response_1.sendSuccess)(res, result, 'Cập nhật đánh giá thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async approveReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const { teacherNote, rewardQuota } = req.body;
            const result = await cms_service_1.cmsService.updateReview(reviewId, { isApproved: true, teacherNote, rewardQuota: rewardQuota ?? 5 }, req);
            (0, api_response_1.sendSuccess)(res, result, 'Duyệt bài đánh giá và kích hoạt thưởng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const result = await cms_service_1.cmsService.deleteReview(reviewId);
            (0, api_response_1.sendSuccess)(res, result, 'Xóa đánh giá thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CmsController = CmsController;
exports.cmsController = new CmsController();
