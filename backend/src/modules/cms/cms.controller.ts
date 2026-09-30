import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as cmsService from './cms.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createPage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await cmsService.create(req.body, req.userId!);
    successResponse(res, page, 'Page created', 201);
  } catch (error) { next(error); }
}

export async function updatePage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await cmsService.update((req.params.id as string), req.body);
    successResponse(res, page, 'Page updated');
  } catch (error) { next(error); }
}

export async function deletePage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await cmsService.deletePage((req.params.id as string));
    successResponse(res, null, 'Page deleted');
  } catch (error) { next(error); }
}

export async function getPageBySlug(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await cmsService.getBySlug(req.params.slug as string);
    successResponse(res, page, 'Page retrieved');
  } catch (error) { next(error); }
}

export async function listPages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, type, status } = req.query as any;
    const result = await cmsService.list({ page: Number(page), limit: Number(limit), type, status });
    paginatedResponse(res, result.pages, result.total, Number(page), Number(limit), 'Pages retrieved');
  } catch (error) { next(error); }
}
