import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as reviewService from './review.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.createReview(req.userId!, req.body);
    successResponse(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.updateReview(req.params.id as string as string, req.userId!, req.body);
    successResponse(res, review, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.deleteReview(req.params.id as string as string, req.userId!);
    successResponse(res, result, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await reviewService.getReviews(req.params.bookId as string as string, page, limit);
    paginatedResponse(res, result.reviews, result.total, result.page, result.limit, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getBookRating(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.getBookRating(req.params.bookId as string as string);
    successResponse(res, result, 'Book rating retrieved successfully');
  } catch (error) {
    next(error);
  }
}

