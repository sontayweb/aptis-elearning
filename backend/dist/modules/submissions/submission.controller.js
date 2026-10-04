"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionController = exports.SubmissionController = void 0;
const submission_service_1 = require("./submission.service");
const submission_dto_1 = require("./submission.dto");
const api_response_1 = require("../../utils/api-response");
const audio_service_1 = require("../audio/audio.service");
class SubmissionController {
    async myHistory(req, res, next) {
        try {
            const userId = req.user.userId;
            const filter = submission_dto_1.myHistoryFilterSchema.parse(req.query);
            const result = await submission_service_1.submissionService.getMyHistory(userId, filter);
            (0, api_response_1.sendSuccess)(res, result.items, 'Lấy lịch sử làm bài thành công', 200, {
                summary: result.summary,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async start(req, res, next) {
        try {
            const userId = req.user.userId;
            const { examId } = submission_dto_1.startSubmissionSchema.parse(req.body);
            const result = await submission_service_1.submissionService.startSubmission(userId, examId);
            (0, api_response_1.sendSuccess)(res, result, 'Bắt đầu bài thi thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async autosave(req, res, next) {
        try {
            const userId = req.user.userId;
            const submissionId = req.params.id;
            const validatedInput = submission_dto_1.autosaveAnswerSchema.parse(req.body);
            const result = await submission_service_1.submissionService.autosave(userId, submissionId, validatedInput);
            (0, api_response_1.sendSuccess)(res, result, 'Lưu nháp câu trả lời thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async heartbeat(req, res, next) {
        try {
            const userId = req.user.userId;
            const submissionId = req.params.id;
            const validatedInput = submission_dto_1.heartbeatSchema.parse(req.body);
            const result = await submission_service_1.submissionService.heartbeat(userId, submissionId, validatedInput);
            (0, api_response_1.sendSuccess)(res, result, 'Heartbeat OK', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async resume(req, res, next) {
        try {
            const userId = req.user.userId;
            const submissionId = req.params.id;
            const result = await submission_service_1.submissionService.resume(userId, submissionId);
            (0, api_response_1.sendSuccess)(res, result, 'Khôi phục phiên làm bài thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async submit(req, res, next) {
        try {
            const userId = req.user.userId;
            const submissionId = req.params.id;
            const result = await submission_service_1.submissionService.submit(userId, submissionId);
            (0, api_response_1.sendSuccess)(res, result, 'Nộp bài thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async detail(req, res, next) {
        try {
            const userId = req.user.userId;
            const role = req.user?.role;
            const submissionId = req.params.id;
            const result = await submission_service_1.submissionService.getSubmissionDetail(userId, submissionId, role);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy kết quả bài thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async uploadAudio(req, res, next) {
        try {
            const userId = req.user.userId;
            const submissionId = req.params.id;
            const questionId = req.params.questionId;
            const file = req.file;
            if (!file) {
                (0, api_response_1.sendError)(res, 'Vui lòng đính kèm tệp âm thanh ghi âm', 400);
                return;
            }
            const durationSeconds = req.body.durationSeconds
                ? parseInt(req.body.durationSeconds, 10)
                : undefined;
            const result = await audio_service_1.audioService.saveSubmissionAudio(userId, submissionId, questionId, file, durationSeconds);
            (0, api_response_1.sendSuccess)(res, result, 'Lưu file âm thanh thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async streamAudio(req, res, next) {
        try {
            const userId = req.user.userId;
            const role = req.user?.role;
            const submissionId = req.params.id;
            const questionId = req.params.questionId;
            await audio_service_1.audioService.streamSubmissionAudio(submissionId, questionId, req.headers, res, userId, role);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubmissionController = SubmissionController;
exports.submissionController = new SubmissionController();
