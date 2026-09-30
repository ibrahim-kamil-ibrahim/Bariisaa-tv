import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as userDetailService from './user-detail.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function getUserDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userDetailService.getUserDetail(req.params.id as string);
    successResponse(res, data, 'User detail retrieved');
  } catch (error) { next(error); }
}

export async function getUserActivity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query as any;
    const result = await userDetailService.getUserActivity(req.params.id as string, Number(page), Number(limit));
    paginatedResponse(res, result.activities, result.total, Number(page), Number(limit), 'User activity retrieved');
  } catch (error) { next(error); }
}

export async function getLoginHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userDetailService.getLoginHistory(req.params.id as string);
    successResponse(res, data, 'Login history retrieved');
  } catch (error) { next(error); }
}

export async function getUserDevices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userDetailService.getUserDevices(req.params.id as string);
    successResponse(res, data, 'User devices retrieved');
  } catch (error) { next(error); }
}

export async function adminAction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userDetailService.adminAction(req.params.id as string, req.body, req.userId!);
    successResponse(res, result, 'Admin action completed');
  } catch (error) { next(error); }
}
