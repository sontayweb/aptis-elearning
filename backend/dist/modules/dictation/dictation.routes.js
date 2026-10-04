"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dictation_controller_1 = require("./dictation.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Public routes (có thể kèm token nếu đã đăng nhập để lấy progress)
router.get('/levels', (req, res, next) => dictation_controller_1.dictationController.getLevels(req, res, next));
router.get('/lessons', (req, res, next) => dictation_controller_1.dictationController.getLessons(req, res, next));
router.get('/lessons/:id', (req, res, next) => dictation_controller_1.dictationController.getLessonDetail(req, res, next));
// Protected routes (Nộp bài cần đăng nhập để lưu tiến độ)
router.post('/sentences/:id/check', auth_guard_1.authGuard, (req, res, next) => dictation_controller_1.dictationController.checkSentence(req, res, next));
exports.default = router;
