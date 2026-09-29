import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === 'development';
  const timestamp = new Date().toISOString();

  // 1. Lỗi Validation từ Zod DTO
  if (err instanceof ZodError || err.name === 'ZodError' || Array.isArray(err.errors)) {
    const errorDetails = (err.errors || []).map((e: any) => ({
      field: e.path ? e.path.join('.') : undefined,
      message: e.message,
    }));

    console.warn(
      `[${timestamp}] [VALIDATION_ERROR 422] ${req.method} ${req.originalUrl}:`,
      JSON.stringify(errorDetails)
    );

    sendError(res, 'Dữ liệu yêu cầu không hợp lệ', 422, {
      code: 'VALIDATION_ERROR',
      details: errorDetails,
    });
    return;
  }

  // 2. Lỗi Prisma: Không kết nối được Database (Database offline, sai host/port hoặc thông tin đăng nhập)
  if (err.name === 'PrismaClientInitializationError') {
    console.error(
      `[${timestamp}] [DB_CONNECT_ERROR 503] ${req.method} ${req.originalUrl}:`,
      err.message
    );

    sendError(res, 'Cơ sở dữ liệu tạm thời chưa sẵn sàng hoặc không thể kết nối', 503, {
      code: 'DB_CONNECTION_FAILED',
      details: isDev ? err.message : undefined,
      stack: isDev ? err.stack : undefined,
    });
    return;
  }

  // 3. Lỗi Prisma: Known Request Error (P2002 trùng lặp, P2025 không tìm thấy, P2003 lỗi foreign key...)
  if (err.name === 'PrismaClientKnownRequestError') {
    console.error(
      `[${timestamp}] [PRISMA_ERROR ${err.code}] ${req.method} ${req.originalUrl}:`,
      err.message
    );

    if (err.code === 'P2002') {
      const target = err.meta?.target ? ` (${err.meta.target})` : '';
      sendError(res, `Dữ liệu đã tồn tại trong hệ thống${target}`, 409, {
        code: 'DUPLICATE_RECORD',
        field: err.meta?.target,
      });
      return;
    }

    if (err.code === 'P2025') {
      sendError(res, 'Bản ghi không tồn tại hoặc đã bị xóa', 404, {
        code: 'NOT_FOUND',
      });
      return;
    }

    if (err.code === 'P2003') {
      sendError(res, 'Ràng buộc dữ liệu liên kết không hợp lệ', 400, {
        code: 'FOREIGN_KEY_VIOLATION',
        field: err.meta?.field_name,
      });
      return;
    }

    sendError(res, 'Lỗi thao tác cơ sở dữ liệu', 400, {
      code: `PRISMA_${err.code}`,
      details: isDev ? err.message : undefined,
    });
    return;
  }

  // 4. Lỗi Prisma: Tham số truy vấn không khớp Schema
  if (err.name === 'PrismaClientValidationError') {
    console.error(
      `[${timestamp}] [PRISMA_VALIDATION_ERROR 400] ${req.method} ${req.originalUrl}:`,
      err.message
    );

    sendError(res, 'Tham số truy vấn cơ sở dữ liệu không hợp lệ', 400, {
      code: 'QUERY_VALIDATION_ERROR',
      details: isDev ? err.message : undefined,
    });
    return;
  }

  // 5. Các lỗi thông thường khác (500 hoặc custom statusCode)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';

  console.error(
    `[${timestamp}] [SERVER_ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`,
    err.message || err
  );
  if (err.stack) {
    console.error(err.stack);
  }

  sendError(res, message, statusCode, {
    code: err.code || 'INTERNAL_SERVER_ERROR',
    stack: isDev ? err.stack : undefined,
  });
};
