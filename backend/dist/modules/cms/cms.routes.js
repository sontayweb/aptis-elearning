"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cms_controller_1 = require("./cms.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const role_guard_1 = require("../../middlewares/role.guard");
const router = (0, express_1.Router)();
// Public routes
router.get('/pages/:slug', (req, res, next) => cms_controller_1.cmsController.getPage(req, res, next));
router.get('/reviews', (req, res, next) => cms_controller_1.cmsController.getReviews(req, res, next));
router.get('/hall-of-fame', (req, res, next) => cms_controller_1.cmsController.getHallOfFame(req, res, next));
// Student route: Nộp review đề thi thật
router.post('/reviews', auth_guard_1.authGuard, (req, res, next) => cms_controller_1.cmsController.createReview(req, res, next));
// Admin routes: Quản trị & Duyệt review, kích hoạt thưởng
router.patch('/reviews/:id', auth_guard_1.authGuard, (0, role_guard_1.roleGuard)(['ADMIN']), (req, res, next) => cms_controller_1.cmsController.updateReview(req, res, next));
router.patch('/reviews/:id/approve', auth_guard_1.authGuard, (0, role_guard_1.roleGuard)(['ADMIN']), (req, res, next) => cms_controller_1.cmsController.approveReview(req, res, next));
router.delete('/reviews/:id', auth_guard_1.authGuard, (0, role_guard_1.roleGuard)(['ADMIN']), (req, res, next) => cms_controller_1.cmsController.deleteReview(req, res, next));
exports.default = router;
