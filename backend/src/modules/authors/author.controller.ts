import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as authorService from './author.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export async function createAuthor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await authorService.createAuthor(req.body);
    successResponse(res, data, 'Author created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateAuthor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await authorService.updateAuthor(req.params.id as string, req.body);
    successResponse(res, data, 'Author updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteAuthor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await authorService.deleteAuthor(req.params.id as string);
    successResponse(res, data, 'Author deleted');
  } catch (error) {
    next(error);
  }
}

export async function getAuthorById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await authorService.getAuthorById(req.params.id as string, page, limit);
    successResponse(res, data, 'Author retrieved');
  } catch (error) {
    next(error);
  }
}

export async function uploadAuthorPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No image file provided', 400);
    const data = await authorService.uploadAuthorPhoto(req.params.id as string, req.file);
    successResponse(res, data, 'Author photo uploaded');
  } catch (error) {
    next(error);
  }
}

export async function listAuthors(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const { authors, total } = await authorService.listAuthors(page, limit, search);
    paginatedResponse(res, authors, total, page, limit, 'Authors retrieved');
  } catch (error) {
    next(error);
  }
}

