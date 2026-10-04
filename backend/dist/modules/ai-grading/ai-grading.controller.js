"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiGradingController = exports.AiGradingController = void 0;
const ai_grading_service_1 = require("./ai-grading.service");
const api_response_1 = require("../../utils/api-response");
class AiGradingController {
    async evaluate(req, res, next) {
        try {
            const submissionId = req.params.id;
            const user = req.user;
            const result = await ai_grading_service_1.aiGradingService.evaluateSubmission(submissionId, user?.userId, user?.role);
            (0, api_response_1.sendSuccess)(res, result, 'Đánh giá AI hoàn tất thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getFeedback(req, res, next) {
        try {
            const submissionId = req.params.id;
            const user = req.user;
            const feedback = await ai_grading_service_1.aiGradingService.getAiFeedback(submissionId, user?.userId, user?.role);
            (0, api_response_1.sendSuccess)(res, feedback, 'Lấy kết quả đánh giá AI thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AiGradingController = AiGradingController;
exports.aiGradingController = new AiGradingController();
