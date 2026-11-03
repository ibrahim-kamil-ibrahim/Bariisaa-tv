import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('AppError (non-operational):', err);
    }
    return errorResponse(res, err.message, err.statusCode);
  }

  logger.error(`Unexpected error on ${_req.method} ${_req.originalUrl}:`, err);

  // Prisma schema drift: the generated client knows about a table/column that
  // the connected database does not have yet (pending migration). Without this
  // branch every such request is an opaque "Internal server error" in prod.
  if (err.name === 'PrismaClientKnownRequestError') {
    const code = (err as Error & { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      logger.error(
        `Database schema is out of date (${code}). Run "npx prisma migrate deploy" on this environment.`
      );
      return errorResponse(
        res,
        'Database schema is out of date. Please apply pending migrations and try again.',
        500
      );
    }
  }

  if (err.name === 'ZodError') {
    return errorResponse(res, 'Validation error', 422);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Session expired. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Session expired. Please log in again.', 401);
  }

  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'You need to log in to do that.', 401);
  }

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
}

export function notFoundHandler(_req: Request, res: Response) {
  return errorResponse(res, 'Route not found', 404);
}
