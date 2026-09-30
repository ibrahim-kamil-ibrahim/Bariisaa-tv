import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as roleService from './role.service';
import { successResponse } from '../../utils/response';

export async function listRoles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const roles = await roleService.listRoles();
    successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getRoleById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const role = await roleService.getRoleById(req.params.id as string as string);
    successResponse(res, role, 'Role retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllPermissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const permissions = await roleService.getAllPermissions();
    successResponse(res, permissions, 'Permissions retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const role = await roleService.createRole(req.body);
    successResponse(res, role, 'Role created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const role = await roleService.updateRole(req.params.id as string as string, req.body);
    successResponse(res, role, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await roleService.deleteRole(req.params.id as string as string);
    successResponse(res, result, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
}
