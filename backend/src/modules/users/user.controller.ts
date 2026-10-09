import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as userService from './user.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.getProfile(req.userId!);
    successResponse(res, data, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.updateProfile(req.userId!, req.body);
    successResponse(res, data, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No image file provided', 400);

    const data = await userService.updateAvatar(
      req.userId!,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    successResponse(res, data, 'Avatar updated');
  } catch (error) {
    next(error);
  }
}

export async function getDevices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.getDevices(req.userId!);
    successResponse(res, data, 'Devices retrieved');
  } catch (error) {
    next(error);
  }
}

export async function removeDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.removeDevice(req.userId!, req.params.id as string as string);
    successResponse(res, data, 'Device removed');
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const { users, total } = await userService.listUsers(page, limit, search, status);
    paginatedResponse(res, users, total, page, limit, 'Users retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.getUserById(req.params.id as string as string);
    successResponse(res, data, 'User retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const data = await userService.updateUserStatus(req.params.id as string as string, status);
    successResponse(res, data, 'User status updated');
  } catch (error) {
    next(error);
  }
}

export async function bulkDelete(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const data = await userService.bulkDeleteUsers(ids);
    successResponse(res, data, 'Users deleted');
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ids, status } = req.body;
    const data = await userService.bulkUpdateStatus(ids, status);
    successResponse(res, data, 'Users updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.userId === req.params.id) throw new AppError('Cannot delete your own account', 400);
    const data = await userService.deleteUser(req.params.id as string);
    successResponse(res, data, 'User deleted');
  } catch (error) {
    next(error);
  }
}

export async function adminResetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.adminResetPassword(req.params.id as string, req.body.newPassword);
    successResponse(res, data, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
}

export async function assignRoles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await userService.assignUserRoles(
      req.params.id as string,
      req.body.roleIds,
      req.userId!,
      req.userRoles || []
    );
    successResponse(res, data, 'User roles updated');
  } catch (error) {
    next(error);
  }
}

