import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as permissionsService from './permissions.service';
import { successResponse } from '../../utils/response';

export async function getPermissionMatrix(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await permissionsService.getPermissionMatrix();
    successResponse(res, data, 'Permission matrix retrieved');
  } catch (error) { next(error); }
}

export async function updateRolePermissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await permissionsService.updateRolePermissions(req.params.id as string, req.body.permissionIds);
    successResponse(res, data, 'Role permissions updated');
  } catch (error) { next(error); }
}

export async function getResources(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const resources = await permissionsService.getResources();
    successResponse(res, resources, 'Resources retrieved');
  } catch (error) { next(error); }
}
