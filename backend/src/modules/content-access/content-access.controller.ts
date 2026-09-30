import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as contentAccessService from './content-access.service';
import { successResponse } from '../../utils/response';

export async function setContentAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await contentAccessService.setContentAccess(req.params.id as string, req.body);
    successResponse(res, result, 'Content access updated');
  } catch (error) {
    next(error);
  }
}
