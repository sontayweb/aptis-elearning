"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = exports.StudentController = void 0;
const student_service_1 = require("./student.service");
const api_response_1 = require("../../utils/api-response");
const zod_1 = require("zod");
const updateGoalSchema = zod_1.z.object({
    aim: zod_1.z.string().optional(),
    examDate: zod_1.z.string().optional(),
    dailyTarget: zod_1.z.number().min(1).max(200).optional(),
});
class StudentController {
    async getDashboardStats(req, res, next) {
        try {
            const userId = req.user?.userId;
            const result = await student_service_1.studentService.getDashboardStats(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy thông tin dashboard học viên thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getStreak(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await student_service_1.studentService.getStreak(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy chuỗi ngày streak học tập thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getGoal(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await student_service_1.studentService.getGoal(userId);
            (0, api_response_1.sendSuccess)(res, result, 'Lấy mục tiêu học tập thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updateGoal(req, res, next) {
        try {
            const userId = req.user.userId;
            const data = updateGoalSchema.parse(req.body);
            const result = await student_service_1.studentService.updateGoal(userId, data);
            (0, api_response_1.sendSuccess)(res, result, 'Cập nhật mục tiêu học tập thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StudentController = StudentController;
exports.studentController = new StudentController();
