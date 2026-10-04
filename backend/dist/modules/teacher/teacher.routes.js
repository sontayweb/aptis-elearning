"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_controller_1 = require("./teacher.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const role_guard_1 = require("../../middlewares/role.guard");
const router = (0, express_1.Router)();
router.use(auth_guard_1.authGuard);
// Route cho học viên tham gia và xem lớp học của mình
router.post('/classrooms/join', (req, res, next) => teacher_controller_1.teacherController.joinClassroom(req, res, next));
router.get('/classrooms/my', (req, res, next) => teacher_controller_1.teacherController.getStudentClassrooms(req, res, next));
// Routes dành riêng cho Giảng Viên và Quản Trị Viên (TEACHER, ADMIN)
const teacherOnly = (0, role_guard_1.roleGuard)(['TEACHER', 'ADMIN']);
router.get('/grading-queue', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.getGradingQueue(req, res, next));
router.get('/submissions/:id', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.getSubmissionForGrading(req, res, next));
router.post('/submissions/:id/grade', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.gradeSubmission(req, res, next));
router.get('/stats', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.getStats(req, res, next));
router.post('/classrooms', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.createClassroom(req, res, next));
router.get('/classrooms', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.getClassrooms(req, res, next));
router.get('/classrooms/:id/members', teacherOnly, (req, res, next) => teacher_controller_1.teacherController.getClassroomMembers(req, res, next));
exports.default = router;
