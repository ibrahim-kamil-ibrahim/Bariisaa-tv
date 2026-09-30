import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as liveService from './live-monitoring.service';
import { successResponse } from '../../utils/response';

export async function getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { metric, hours = 24 } = req.query as any;
    const data = await liveService.getMetrics(metric as string, Number(hours));
    successResponse(res, data, 'Metrics retrieved');
  } catch (error) { next(error); }
}

export async function getOnlineUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await liveService.getOnlineUsers();
    successResponse(res, data, 'Online users retrieved');
  } catch (error) { next(error); }
}

export async function recordMetric(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const metric = await liveService.recordMetric(req.body);
    successResponse(res, metric, 'Metric recorded', 201);
  } catch (error) { next(error); }
}
