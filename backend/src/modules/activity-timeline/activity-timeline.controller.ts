import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as activityService from './activity-timeline.service';
import { paginatedResponse, successResponse } from '../../utils/response';

export async function listActivities(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, userId, module, action, fromDate, toDate } = req.query as any;
    const result = await activityService.list({ page: Number(page), limit: Number(limit), userId, module, action, fromDate, toDate });
    paginatedResponse(res, result.activities, result.total, Number(page), Number(limit), 'Activities retrieved');
  } catch (error) { next(error); }
}

export async function getActivityStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await activityService.getStats();
    successResponse(res, stats, 'Activity stats retrieved');
  } catch (error) { next(error); }
}
