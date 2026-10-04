"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examController = exports.ExamController = void 0;
const exam_service_1 = require("./exam.service");
const exam_dto_1 = require("./exam.dto");
const api_response_1 = require("../../utils/api-response");
class ExamController {
    async list(req, res, next) {
        try {
            const filter = exam_dto_1.examFilterSchema.parse(req.query);
            const userId = req.user?.userId;
            const result = await exam_service_1.examService.listExams(filter, userId);
            (0, api_response_1.sendSuccess)(res, result.exams, 'Lấy danh sách đề thi thành công', 200, {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async detail(req, res, next) {
        try {
            const examId = req.params.id;
            const userId = req.user?.userId;
            const result = await exam_service_1.examService.getExamDetail(examId, userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy thông tin đề thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async questions(req, res, next) {
        try {
            const examId = req.params.id;
            const result = await exam_service_1.examService.getExamQuestions(examId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy danh sách câu hỏi phòng thi thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async customBuilder(req, res, next) {
        try {
            const userId = req.user.userId;
            const validatedInput = exam_dto_1.customExamBuilderSchema.parse(req.body);
            const result = await exam_service_1.examService.createCustomExam(userId, validatedInput);
            (0, api_response_1.sendSuccess)(res, result, 'Tạo bộ đề tùy biến thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExamController = ExamController;
exports.examController = new ExamController();
