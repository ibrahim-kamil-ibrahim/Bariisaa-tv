import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as reportService from './report-builder.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function listReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, type } = req.query as any;
    const result = await reportService.list(req.userId!, type, Number(page), Number(limit));
    paginatedResponse(res, result.reports, result.total, Number(page), Number(limit), 'Reports retrieved');
  } catch (error) { next(error); }
}

export async function createReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.create(req.userId!, req.body);
    successResponse(res, report, 'Report created', 201);
  } catch (error) { next(error); }
}

export async function updateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.update(req.params.id as string, req.userId!, req.body);
    successResponse(res, report, 'Report updated');
  } catch (error) { next(error); }
}

export async function deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await reportService.deleteReport(req.params.id as string, req.userId!);
    successResponse(res, null, 'Report deleted');
  } catch (error) { next(error); }
}

export async function exportReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const type = req.params.type as string;
    const { fromDate, toDate, format = 'csv' } = req.query as Record<string, string | undefined>;
    const data = await reportService.exportData(type, fromDate, toDate, format);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.${format}`);
    res.json(data);
  } catch (error) { next(error); }
}
