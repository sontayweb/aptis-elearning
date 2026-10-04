"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const database_1 = require("../../config/database");
const password_1 = require("../../utils/password");
const token_1 = require("../../utils/token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const googleClient = process.env.GOOGLE_CLIENT_ID
    ? new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    : null;
class AuthService {
    async register(data) {
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existingUser) {
            throw { statusCode: 409, message: 'Email này đã được đăng ký tài khoản' };
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                password_hash: passwordHash,
                full_name: data.fullName,
                phone_number: data.phoneNumber || null,
                role: 'STUDENT',
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                avatar_url: true,
                role: true,
                created_at: true,
            },
        });
        const tokens = (0, token_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        audit_service_1.auditService.record({
            action: client_1.AuditAction.USER_CREATE,
            entityType: 'USER',
            entityId: user.id,
            description: `Học viên mới đăng ký tài khoản: ${user.full_name} (${user.email})`,
            newValue: { email: user.email, fullName: user.full_name, role: user.role },
            systemActor: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
        return { user, tokens };
    }
    async login(data, req) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
            include: {
                subscriptions: {
                    where: { is_active: true, end_date: { gt: new Date() } },
                    include: { plan: true },
                    take: 1,
                },
            },
        });
        if (!user || !user.password_hash) {
            throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
        }
        if (!user.is_active) {
            throw { statusCode: 403, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' };
        }
        const isMatch = await (0, password_1.comparePassword)(data.password, user.password_hash);
        if (!isMatch) {
            throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
        }
        const tokens = (0, token_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const activeSubscription = user.subscriptions[0] || null;
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.AUTH_LOGIN,
            entityType: 'USER',
            entityId: user.id,
            description: `Đăng nhập thành công tài khoản ${user.full_name} (${user.email})`,
            systemActor: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone_number: user.phone_number,
                avatar_url: user.avatar_url,
                role: user.role,
                subscription: activeSubscription
                    ? {
                        planName: activeSubscription.plan.name,
                        code: activeSubscription.plan.code,
                        endDate: activeSubscription.end_date,
                        aiQuotaLeft: activeSubscription.ai_quota_left,
                        teacherQuotaLeft: activeSubscription.teacher_quota_left,
                    }
                    : null,
            },
            tokens,
        };
    }
    async refreshToken(refreshTokenString) {
        try {
            const decoded = (0, token_1.verifyRefreshToken)(refreshTokenString);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, is_active: true },
            });
            if (!user || !user.is_active) {
                throw { statusCode: 403, message: 'Tài khoản không tồn tại hoặc đã bị khóa' };
            }
            const tokens = (0, token_1.generateTokens)({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            return tokens;
        }
        catch (err) {
            throw { statusCode: 401, message: 'Refresh token không hợp lệ hoặc đã hết hạn' };
        }
    }
    async getProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                avatar_url: true,
                role: true,
                created_at: true,
                subscriptions: {
                    where: { is_active: true, end_date: { gt: new Date() } },
                    include: { plan: true },
                    take: 1,
                },
            },
        });
        if (!user) {
            throw { statusCode: 404, message: 'Không tìm thấy thông tin người dùng' };
        }
        const activeSub = user.subscriptions[0] || null;
        return {
            ...user,
            activeSubscription: activeSub
                ? {
                    planName: activeSub.plan.name,
                    code: activeSub.plan.code,
                    endDate: activeSub.end_date,
                    aiQuotaLeft: activeSub.ai_quota_left,
                    teacherQuotaLeft: activeSub.teacher_quota_left,
                }
                : null,
        };
    }
    async googleAuth(credential, req) {
        let email;
        let fullName;
        let avatarUrl = null;
        if (googleClient && process.env.GOOGLE_CLIENT_ID) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                if (!payload || !payload.email) {
                    throw new Error('Google payload không chứa email');
                }
                email = payload.email.toLowerCase();
                fullName = payload.name || 'Người dùng Google';
                avatarUrl = payload.picture || null;
            }
            catch (err) {
                throw { statusCode: 400, message: 'Chữ ký Google ID Token không hợp lệ: ' + err.message };
            }
        }
        else {
            // Môi trường Dev/Test hoặc khi chưa điền GOOGLE_CLIENT_ID
            const decoded = jsonwebtoken_1.default.decode(credential);
            if (!decoded || !decoded.email) {
                throw { statusCode: 400, message: 'Google credential token không hợp lệ' };
            }
            email = decoded.email.toLowerCase();
            fullName = decoded.name || 'Người dùng Google';
            avatarUrl = decoded.picture || null;
        }
        let user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            user = await database_1.prisma.user.create({
                data: {
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    role: 'STUDENT',
                },
            });
        }
        else {
            if (!user.is_active) {
                throw { statusCode: 403, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' };
            }
            if (!user.avatar_url && avatarUrl) {
                user = await database_1.prisma.user.update({
                    where: { id: user.id },
                    data: { avatar_url: avatarUrl },
                });
            }
        }
        const tokens = (0, token_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.AUTH_LOGIN,
            entityType: 'USER',
            entityId: user.id,
            description: `Đăng nhập qua Google OAuth: ${user.full_name} (${user.email})`,
            systemActor: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                role: user.role,
            },
            tokens,
        };
    }
    async forgotPassword(email) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            // Bảo mật: không báo lỗi user không tồn tại để tránh enum email
            return { message: 'Nếu email tồn tại, đường link đặt lại mật khẩu đã được gửi' };
        }
        // Sinh token reset mật khẩu có hạn 1 giờ, gắn pwdHashSnippet để ngăn chặn tái sử dụng (Single-Use Token)
        const resetToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            type: 'PASSWORD_RESET',
            pwdSnippet: (user.password_hash || '').substring(0, 10),
        }, process.env.JWT_ACCESS_SECRET || 'aptis_secret_access_key_super_secure_2026', { expiresIn: '1h' });
        return {
            message: 'Đường dẫn đặt lại mật khẩu đã được tạo',
            resetToken, // Dùng để gửi mail hoặc kiểm thử
        };
    }
    async resetPassword(data, req) {
        try {
            const decoded = jsonwebtoken_1.default.verify(data.token, process.env.JWT_ACCESS_SECRET || 'aptis_secret_access_key_super_secure_2026');
            if (decoded.type !== 'PASSWORD_RESET') {
                throw new Error('Token không hợp lệ');
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user) {
                throw new Error('Tài khoản không tồn tại');
            }
            // Kiểm tra Single-Use Token: snippet mật khẩu cũ phải khớp
            if (decoded.pwdSnippet && (user.password_hash || '').substring(0, 10) !== decoded.pwdSnippet) {
                throw new Error('Token đặt lại mật khẩu này đã được sử dụng trước đó');
            }
            const passwordHash = await (0, password_1.hashPassword)(data.newPassword);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { password_hash: passwordHash },
            });
            audit_service_1.auditService.record({
                req,
                action: client_1.AuditAction.AUTH_PASSWORD_RESET,
                entityType: 'USER',
                entityId: user.id,
                description: `Đặt lại mật khẩu thành công cho tài khoản ${user.full_name} (${user.email})`,
                systemActor: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    role: user.role,
                },
            });
            return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' };
        }
        catch (err) {
            throw {
                statusCode: 400,
                message: err.message || 'Đường dẫn đặt lại mật khẩu đã hết hạn hoặc không hợp lệ',
            };
        }
    }
    /**
     * Cập nhật thông tin hồ sơ cá nhân
     */
    async updateProfile(userId, data, req) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        const updateData = {};
        if (typeof data.fullName === 'string')
            updateData.full_name = data.fullName.trim();
        if (typeof data.phoneNumber !== 'undefined')
            updateData.phone_number = data.phoneNumber?.trim() || null;
        if (typeof data.avatarUrl !== 'undefined')
            updateData.avatar_url = data.avatarUrl || null;
        if (typeof data.targetBand !== 'undefined')
            updateData.target_band = data.targetBand;
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                avatar_url: true,
                role: true,
                target_band: true,
                created_at: true,
                updated_at: true,
            },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.USER_STATUS_CHANGE,
            entityType: 'USER',
            entityId: userId,
            description: `Người dùng ${updatedUser.full_name} (${updatedUser.email}) tự cập nhật hồ sơ cá nhân`,
            newValue: updateData,
            systemActor: {
                id: updatedUser.id,
                name: updatedUser.full_name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
        return updatedUser;
    }
    /**
     * Đổi mật khẩu tài khoản
     */
    async changePassword(userId, data, req) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw { statusCode: 404, message: 'Người dùng không tồn tại' };
        }
        // Nếu tài khoản có password_hash thì phải xác thực mật khẩu hiện tại
        if (user.password_hash) {
            const isMatch = await (0, password_1.comparePassword)(data.currentPassword, user.password_hash);
            if (!isMatch) {
                throw { statusCode: 400, message: 'Mật khẩu hiện tại không chính xác' };
            }
        }
        const newPasswordHash = await (0, password_1.hashPassword)(data.newPassword);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { password_hash: newPasswordHash },
        });
        audit_service_1.auditService.record({
            req,
            action: client_1.AuditAction.AUTH_PASSWORD_RESET,
            entityType: 'USER',
            entityId: userId,
            description: `Người dùng ${user.full_name} (${user.email}) đổi mật khẩu thành công`,
            systemActor: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
        return { message: 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.' };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
