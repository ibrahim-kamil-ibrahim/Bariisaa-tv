import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as highlightService from './highlight.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const highlight = await highlightService.createHighlight(req.userId!, req.body);
    successResponse(res, highlight, 'Highlight created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await highlightService.deleteHighlight(req.params.id as string, req.userId!);
    successResponse(res, result, 'Highlight deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getHighlights(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const highlights = await highlightService.getHighlights(req.userId!, req.params.bookId as string);
    successResponse(res, highlights, 'Highlights retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllHighlights(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await highlightService.getAllHighlights(req.userId!, page, limit);
    paginatedResponse(res, result.highlights, result.total, result.page, result.limit, 'Highlights retrieved successfully');
  } catch (error) {
    next(error);
  }
}

