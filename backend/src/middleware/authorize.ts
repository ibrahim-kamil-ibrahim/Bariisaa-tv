import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { errorResponse } from '../utils/response';

export function authorize(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userPermissions || !req.userRoles) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (req.userRoles.includes('super_admin')) {
      return next();
    }

    const hasPermission = requiredPermissions.some(perm =>
      req.userPermissions!.includes(perm)
    );

    if (!hasPermission) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRoles) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const hasRole = roles.some(role => req.userRoles!.includes(role));

    if (!hasRole) {
      return errorResponse(res, 'Insufficient role', 403);
    }

    next();
  };
}
