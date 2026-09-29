import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | any;
  meta?: Record<string, any>;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Thao tác thành công',
  statusCode: number = 200,
  meta?: Record<string, any>
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message: string = 'Đã có lỗi xảy ra',
  statusCode: number = 400,
  error?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
