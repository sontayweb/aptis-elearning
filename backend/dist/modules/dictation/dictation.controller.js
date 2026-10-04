"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictationController = exports.DictationController = void 0;
const dictation_service_1 = require("./dictation.service");
const client_1 = require("@prisma/client");
const api_response_1 = require("../../utils/api-response");
const zod_1 = require("zod");
const checkSentenceSchema = zod_1.z.object({
    mode: zod_1.z.nativeEnum(client_1.DictationMode).default(client_1.DictationMode.DICTATION),
    submittedText: zod_1.z.string().optional().default(''),
    audioUrl: zod_1.z.string().optional(),
});
class DictationController {
    async getLevels(req, res, next) {
        try {
            const userId = req.user?.userId;
            const result = await dictation_service_1.dictationService.getLevelsSummary(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy tổng quan Level nghe chép thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getLessons(req, res, next) {
        try {
            const level = req.query.level || client_1.DictationLevel.FOUNDATION;
            const userId = req.user?.userId;
            const result = await dictation_service_1.dictationService.getLessons(level, userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy danh sách bài học thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getLessonDetail(req, res, next) {
        try {
            const lessonId = req.params.id;
            const result = await dictation_service_1.dictationService.getLessonDetail(lessonId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy chi tiết bài học thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async checkSentence(req, res, next) {
        try {
            const userId = req.user.userId;
            const sentenceId = req.params.id;
            const { mode, submittedText, audioUrl } = checkSentenceSchema.parse(req.body);
            const result = await dictation_service_1.dictationService.checkSentence(userId, sentenceId, mode, submittedText, audioUrl);
            (0, api_response_1.sendSuccess)(res, result, 'Kiểm tra câu thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DictationController = DictationController;
exports.dictationController = new DictationController();
