import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Record<string, string[]>;
}

// BigInt → number so JSON.stringify doesn't throw on Prisma BigInt fields (e.g. viewCount)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export function successResponse<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function errorResponse(res: Response, message: string, statusCode = 400, errors?: Record<string, string[]>) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
