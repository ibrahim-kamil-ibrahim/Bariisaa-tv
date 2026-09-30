import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as bookService from './book.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export async function createBook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.createBook(req.body);
    successResponse(res, data, 'Book created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateBook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.updateBook(req.params.id as string, req.body);
    successResponse(res, data, 'Book updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteBook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.deleteBook(req.params.id as string);
    successResponse(res, data, 'Book archived');
  } catch (error) {
    next(error);
  }
}

export async function getBookById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.getBookById(req.params.id as string, req.userId);
    successResponse(res, data, 'Book retrieved');
    bookService.incrementViewCount(req.params.id as string).catch(() => {});
  } catch (error) {
    next(error);
  }
}

export async function listBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { books, total } = await bookService.listBooks(req.query as any, req.userId);
    paginatedResponse(res, books, total, (req.query as any).page, (req.query as any).limit, 'Books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getRelatedBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await bookService.getRelatedBooks(req.params.id as string, limit, req.userId);
    successResponse(res, data, 'Related books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getFeaturedBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await bookService.getFeaturedBooks(limit, req.userId);
    successResponse(res, data, 'Featured books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getTrendingBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await bookService.getTrendingBooks(limit, req.userId);
    successResponse(res, data, 'Trending books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getNewReleases(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { books, total } = await bookService.getNewReleases(page, limit, req.userId);
    paginatedResponse(res, books, total, page, limit, 'New releases retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getFreeBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await bookService.getFreeBooks(limit, req.userId);
    successResponse(res, data, 'Free books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function uploadBookCover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No image file provided', 400);
    const data = await bookService.uploadBookCover(req.params.id as string, req.file);
    successResponse(res, data, 'Book cover uploaded');
  } catch (error) {
    next(error);
  }
}

export async function uploadBookThumbnail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No image file provided', 400);
    const data = await bookService.uploadBookThumbnail(req.params.id as string, req.file);
    successResponse(res, data, 'Book thumbnail uploaded');
  } catch (error) {
    next(error);
  }
}

export async function uploadBookAudio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No audio file provided', 400);
    const chapterTitle = (req.body.title as string) || req.file.originalname;
    const trackOrder = parseInt(req.body.trackOrder as string) || 0;
    const data = await bookService.uploadBookAudio(req.params.id as string, req.file, chapterTitle, trackOrder);
    successResponse(res, data, 'Audio file uploaded', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteBookAudio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.deleteBookAudio(req.params.id as string, req.params.audioId as string);
    successResponse(res, data, 'Audio file deleted');
  } catch (error) {
    next(error);
  }
}

export async function uploadBookPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No PDF file provided', 400);
    const data = await bookService.uploadBookPdf(req.params.id as string, req.file);
    successResponse(res, data, 'PDF file uploaded', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteBookPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await bookService.deleteBookPdf(req.params.id as string, req.params.pdfId as string);
    successResponse(res, data, 'PDF file deleted');
  } catch (error) {
    next(error);
  }
}

