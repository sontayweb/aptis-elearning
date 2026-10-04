"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const api_response_1 = require("../utils/api-response");
const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, api_response_1.sendError)(res, 'Yêu cầu xác thực tài khoản', 401);
            return;
        }
        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
            (0, api_response_1.sendError)(res, 'Bạn không có quyền truy cập chức năng này', 403);
            return;
        }
        next();
    };
};
exports.roleGuard = roleGuard;
