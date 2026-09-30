import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as bulkService from './bulk-actions.service';
import { successResponse } from '../../utils/response';

export async function bulkBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids, action, data } = req.body;
    const result = await bulkService.bulkBooks(ids, action, data);
    successResponse(res, result, `Bulk ${action} completed for ${result.count} books`);
  } catch (error) { next(error); }
}

export async function bulkUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids, action, data } = req.body;
    const result = await bulkService.bulkUsers(ids, action, data);
    successResponse(res, result, `Bulk ${action} completed for ${result.count} users`);
  } catch (error) { next(error); }
}

export async function bulkPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids, action, data } = req.body;
    const result = await bulkService.bulkPayments(ids, action, data);
    successResponse(res, result, `Bulk ${action} completed for ${result.count} payments`);
  } catch (error) { next(error); }
}

export async function bulkCoupons(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids, action, data } = req.body;
    const result = await bulkService.bulkCoupons(ids, action, data);
    successResponse(res, result, `Bulk ${action} completed for ${result.count} coupons`);
  } catch (error) { next(error); }
}
