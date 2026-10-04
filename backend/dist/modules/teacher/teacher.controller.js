"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherController = exports.TeacherController = void 0;
const teacher_service_1 = require("./teacher.service");
const teacher_dto_1 = require("./teacher.dto");
const api_response_1 = require("../../utils/api-response");
class TeacherController {
    async getGradingQueue(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const queue = await teacher_service_1.teacherService.getGradingQueue(teacherId);
            (0, api_response_1.sendSuccess)(res, queue, 'Lấy danh sách hàng đợi chấm bài thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getSubmissionForGrading(req, res, next) {
        try {
            const submissionId = req.params.id;
            const submission = await teacher_service_1.teacherService.getSubmissionForGrading(submissionId);
            (0, api_response_1.sendSuccess)(res, submission, 'Lấy chi tiết bài chấm thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async gradeSubmission(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const submissionId = req.params.id;
            const validatedData = teacher_dto_1.gradeSubmissionSchema.parse(req.body);
            const result = await teacher_service_1.teacherService.gradeSubmission(teacherId, submissionId, validatedData);
            (0, api_response_1.sendSuccess)(res, result, 'Chấm điểm và gửi nhận xét thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const stats = await teacher_service_1.teacherService.getStats(teacherId);
            (0, api_response_1.sendSuccess)(res, stats, 'Lấy thống kê giảng viên thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createClassroom(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const validatedData = teacher_dto_1.createClassroomSchema.parse(req.body);
            const classroom = await teacher_service_1.teacherService.createClassroom(teacherId, validatedData);
            (0, api_response_1.sendSuccess)(res, classroom, 'Tạo lớp học thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async getClassrooms(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const classrooms = await teacher_service_1.teacherService.getClassrooms(teacherId);
            (0, api_response_1.sendSuccess)(res, classrooms, 'Lấy danh sách lớp học thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async joinClassroom(req, res, next) {
        try {
            const userId = req.user.userId;
            const { classCode } = teacher_dto_1.joinClassroomSchema.parse(req.body);
            const member = await teacher_service_1.teacherService.joinClassroom(userId, classCode);
            (0, api_response_1.sendSuccess)(res, member, 'Tham gia lớp học thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getClassroomMembers(req, res, next) {
        try {
            const teacherId = req.user.userId;
            const classroomId = req.params.id;
            const members = await teacher_service_1.teacherService.getClassroomMembers(teacherId, classroomId);
            (0, api_response_1.sendSuccess)(res, members, 'Lấy danh sách thành viên lớp học thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getStudentClassrooms(req, res, next) {
        try {
            const userId = req.user.userId;
            const classrooms = await teacher_service_1.teacherService.getStudentClassrooms(userId);
            (0, api_response_1.sendSuccess)(res, classrooms, 'Lấy danh sách lớp học của bạn thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TeacherController = TeacherController;
exports.teacherController = new TeacherController();
