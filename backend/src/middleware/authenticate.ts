import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { errorResponse } from '../utils/response';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  userRoles?: string[];
  userPermissions?: string[];
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access token required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        status: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found. Please login again.', 401);
    }
    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Account is inactive or suspended', 403);
    }

    req.userId = user.id;
    req.userRoles = user.roles.map(ur => ur.role.name);
    req.userPermissions = user.roles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission.name)
    );

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return errorResponse(res, 'Access token expired', 401);
    }
    return errorResponse(res, 'Invalid access token', 401);
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        status: true,
        // Roles/permissions are loaded so downstream handlers (e.g. video
        // playback) can honour role checks without a second lookup.
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (user && user.status === 'ACTIVE') {
      req.userId = user.id;
      req.userRoles = user.roles.map((ur) => ur.role.name);
      req.userPermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      );
    }
  } catch {
    // Token invalid — continue without auth
  }

  next();
}
