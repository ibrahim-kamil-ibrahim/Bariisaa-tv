import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as auditLogService from './audit_log.service';
import { paginatedResponse } from '../../utils/response';

export async function listAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const action = req.query.action as string | undefined;
    const resource = req.query.resource as string | undefined;
    const userId = req.query.userId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const result = await auditLogService.listAuditLogs({
      page,
      limit,
      action,
      resource,
      userId,
      fromDate,
      toDate,
    });

    paginatedResponse(res, result.auditLogs, result.total, page, limit, 'Audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
}
