"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("./student.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Dashboard stats: Cho phép cả guest và user (với token sẽ trả data cá nhân)
router.get('/dashboard-stats', auth_guard_1.optionalAuthGuard, (req, res, next) => student_controller_1.studentController.getDashboardStats(req, res, next));
// Protected routes: Yêu cầu đăng nhập
router.get('/streak', auth_guard_1.authGuard, (req, res, next) => student_controller_1.studentController.getStreak(req, res, next));
router.get('/goal', auth_guard_1.authGuard, (req, res, next) => student_controller_1.studentController.getGoal(req, res, next));
router.put('/goal', auth_guard_1.authGuard, (req, res, next) => student_controller_1.studentController.updateGoal(req, res, next));
exports.default = router;
