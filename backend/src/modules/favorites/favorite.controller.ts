import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as favoriteService from './favorite.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookId } = req.body;
    const result = await favoriteService.toggleFavorite(req.userId!, bookId);
    successResponse(res, result, result.isFavorited ? 'Added to favorites' : 'Removed from favorites');
  } catch (error) {
    next(error);
  }
}

export async function getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await favoriteService.getFavorites(req.userId!, page, limit);
    paginatedResponse(res, result.favorites, result.total, result.page, result.limit, 'Favorites retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function isFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await favoriteService.isFavorite(req.userId!, req.params.bookId as string);
    successResponse(res, { isFavorite: result }, 'Favorite status retrieved');
  } catch (error) {
    next(error);
  }
}

