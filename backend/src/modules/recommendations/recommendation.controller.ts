import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as recommendationService from './recommendation.service';
import { successResponse } from '../../utils/response';

export async function getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await recommendationService.getRecommendations(req.userId!, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getFallbackRecommendations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await recommendationService.getFallbackRecommendations(limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

