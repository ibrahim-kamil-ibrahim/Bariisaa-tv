import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as bookmarkService from './bookmark.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const bookmark = await bookmarkService.createBookmark(req.userId!, req.body);
    successResponse(res, bookmark, 'Bookmark created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await bookmarkService.deleteBookmark(req.params.id as string, req.userId!);
    successResponse(res, result, 'Bookmark deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getBookmarks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as 'AUDIO' | 'PDF' | undefined;
    const bookmarks = await bookmarkService.getBookmarks(req.userId!, req.params.bookId as string, type);
    successResponse(res, bookmarks, 'Bookmarks retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllBookmarks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await bookmarkService.getAllBookmarks(req.userId!, page, limit);
    paginatedResponse(res, result.bookmarks, result.total, result.page, result.limit, 'Bookmarks retrieved successfully');
  } catch (error) {
    next(error);
  }
}

