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

  logger.error('Unexpected error:', err);

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
