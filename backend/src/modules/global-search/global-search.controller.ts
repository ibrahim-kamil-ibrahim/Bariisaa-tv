import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as globalSearchService from './global-search.service';
import { successResponse } from '../../utils/response';

export async function globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { q, type, page = 1, limit = 20 } = req.query as any;
    const results = await globalSearchService.search(q, type, Number(page), Number(limit));
    successResponse(res, results, 'Search results retrieved');
  } catch (error) { next(error); }
}

export async function getSuggestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as any;
    const suggestions = await globalSearchService.getSuggestions(q);
    successResponse(res, suggestions, 'Suggestions retrieved');
  } catch (error) { next(error); }
}
