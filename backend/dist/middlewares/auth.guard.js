"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthGuard = exports.authGuard = void 0;
const token_1 = require("../utils/token");
const api_response_1 = require("../utils/api-response");
const authGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, api_response_1.sendError)(res, 'Yêu cầu đăng nhập để truy cập tài nguyên này', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, token_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        (0, api_response_1.sendError)(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ', 401, err.message);
    }
};
exports.authGuard = authGuard;
const optionalAuthGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = (0, token_1.verifyAccessToken)(token);
            req.user = decoded;
        }
        catch {
            // Bỏ qua lỗi token hết hạn/không hợp lệ cho guard tùy chọn
        }
    }
    next();
};
exports.optionalAuthGuard = optionalAuthGuard;
