import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as backupService from './backups.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createBackup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const backup = await backupService.create(req.body || {}, req.userId!);
    successResponse(res, backup, 'Backup started', 201);
  } catch (error) { next(error); }
}

export async function listBackups(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query as any;
    const result = await backupService.list(Number(page), Number(limit));
    paginatedResponse(res, result.backups, result.total, Number(page), Number(limit), 'Backups retrieved');
  } catch (error) { next(error); }
}

export async function restoreBackup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await backupService.restore((req.params.id as string));
    successResponse(res, null, 'Backup restored');
  } catch (error) { next(error); }
}

export async function deleteBackup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await backupService.deleteBackup((req.params.id as string));
    successResponse(res, null, 'Backup deleted');
  } catch (error) { next(error); }
}
