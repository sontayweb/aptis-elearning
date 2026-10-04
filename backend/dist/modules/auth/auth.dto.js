"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.refreshTokenSchema = exports.googleAuthSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email không đúng định dạng'),
    password: zod_1.z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    fullName: zod_1.z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    phoneNumber: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email không đúng định dạng'),
    password: zod_1.z.string().min(1, 'Mật khẩu không được để trống'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email không đúng định dạng'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token đặt lại mật khẩu không hợp lệ'),
    newPassword: zod_1.z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
exports.googleAuthSchema = zod_1.z.object({
    credential: zod_1.z.string().min(1, 'Google credential token không được để trống'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token không được để trống'),
});
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').optional(),
    phoneNumber: zod_1.z.string().optional().nullable(),
    avatarUrl: zod_1.z.string().optional().nullable(),
    targetBand: zod_1.z.enum(['B1_TARGET', 'B2_TARGET', 'C_TARGET']).optional().nullable(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: zod_1.z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
