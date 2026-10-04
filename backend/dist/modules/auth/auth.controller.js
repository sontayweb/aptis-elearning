"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./auth.dto");
const api_response_1 = require("../../utils/api-response");
class AuthController {
    async register(req, res, next) {
        try {
            const validatedData = auth_dto_1.registerSchema.parse(req.body);
            const result = await auth_service_1.authService.register(validatedData);
            (0, api_response_1.sendSuccess)(res, result, 'Đăng ký tài khoản thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const validatedData = auth_dto_1.loginSchema.parse(req.body);
            const result = await auth_service_1.authService.login(validatedData, req);
            (0, api_response_1.sendSuccess)(res, result, 'Đăng nhập thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = auth_dto_1.refreshTokenSchema.parse(req.body);
            const result = await auth_service_1.authService.refreshToken(refreshToken);
            (0, api_response_1.sendSuccess)(res, result, 'Làm mới token thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await auth_service_1.authService.getProfile(userId);
            (0, api_response_1.sendSuccess)(res, profile, 'Lấy thông tin tài khoản thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async googleAuth(req, res, next) {
        try {
            const { credential } = auth_dto_1.googleAuthSchema.parse(req.body);
            const result = await auth_service_1.authService.googleAuth(credential, req);
            (0, api_response_1.sendSuccess)(res, result, 'Đăng nhập Google thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = auth_dto_1.forgotPasswordSchema.parse(req.body);
            const result = await auth_service_1.authService.forgotPassword(email);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const validatedData = auth_dto_1.resetPasswordSchema.parse(req.body);
            const result = await auth_service_1.authService.resetPassword(validatedData, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const validatedData = auth_dto_1.updateProfileSchema.parse(req.body);
            const result = await auth_service_1.authService.updateProfile(userId, validatedData, req);
            (0, api_response_1.sendSuccess)(res, result, 'Cập nhật thông tin cá nhân thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const validatedData = auth_dto_1.changePasswordSchema.parse(req.body);
            const result = await auth_service_1.authService.changePassword(userId, validatedData, req);
            (0, api_response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
