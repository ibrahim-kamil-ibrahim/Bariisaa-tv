import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as savedFilterService from './saved-filters.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createFilter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await savedFilterService.create(req.userId!, req.body);
    successResponse(res, data, 'Filter saved', 201);
  } catch (error) { next(error); }
}

export async function updateFilter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await savedFilterService.update((req.params.id as string), req.userId!, req.body);
    successResponse(res, data, 'Filter updated');
  } catch (error) { next(error); }
}

export async function deleteFilter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await savedFilterService.deleteFilter((req.params.id as string), req.userId!);
    successResponse(res, null, 'Filter deleted');
  } catch (error) { next(error); }
}

export async function getFilter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await savedFilterService.getById((req.params.id as string), req.userId!);
    successResponse(res, data, 'Filter retrieved');
  } catch (error) { next(error); }
}

export async function listFilters(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, module } = req.query as any;
    const result = await savedFilterService.list(req.userId!, module, Number(page), Number(limit));
    paginatedResponse(res, result.filters, result.total, Number(page), Number(limit), 'Filters retrieved');
  } catch (error) { next(error); }
}
