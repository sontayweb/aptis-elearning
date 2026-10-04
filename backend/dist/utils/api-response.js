"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Thao tác thành công', statusCode = 200, meta) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Đã có lỗi xảy ra', statusCode = 400, error) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error,
    });
};
exports.sendError = sendError;
