"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (req, res, next) => auth_controller_1.authController.register(req, res, next));
router.post('/login', (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.post('/refresh', (req, res, next) => auth_controller_1.authController.refreshToken(req, res, next));
router.post('/google', (req, res, next) => auth_controller_1.authController.googleAuth(req, res, next));
router.post('/forgot-password', (req, res, next) => auth_controller_1.authController.forgotPassword(req, res, next));
router.post('/reset-password', (req, res, next) => auth_controller_1.authController.resetPassword(req, res, next));
// Protected routes
router.get('/me', auth_guard_1.authGuard, (req, res, next) => auth_controller_1.authController.getMe(req, res, next));
router.patch('/profile', auth_guard_1.authGuard, (req, res, next) => auth_controller_1.authController.updateProfile(req, res, next));
router.post('/change-password', auth_guard_1.authGuard, (req, res, next) => auth_controller_1.authController.changePassword(req, res, next));
exports.default = router;
