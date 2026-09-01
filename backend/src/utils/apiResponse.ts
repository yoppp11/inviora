import { Response } from 'express';

export function successResponse<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
}
