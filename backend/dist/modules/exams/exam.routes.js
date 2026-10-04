"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_controller_1 = require("./exam.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Public routes (có thể kèm Bearer token để nhận diện userStatus & bestScore)
router.get('/', auth_guard_1.optionalAuthGuard, (req, res, next) => exam_controller_1.examController.list(req, res, next));
router.get('/:id', auth_guard_1.optionalAuthGuard, (req, res, next) => exam_controller_1.examController.detail(req, res, next));
router.get('/:id/questions', (req, res, next) => exam_controller_1.examController.questions(req, res, next));
// Protected routes
router.post('/custom-builder', auth_guard_1.authGuard, (req, res, next) => exam_controller_1.examController.customBuilder(req, res, next));
exports.default = router;
