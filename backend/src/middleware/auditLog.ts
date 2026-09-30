import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import prisma from '../config/database';

const SENSITIVE_FIELDS = new Set(['password', 'passwordHash', 'token', 'otp', 'code', 'secret', 'authorization', 'newPassword', 'currentPassword']);

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function auditLog(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;

    res.end = function (this: Response, ...args: Parameters<Response['end']>): Response {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.userId) {
        const resourceId = req.params.id || req.body?.id || null;

        prisma.auditLog.create({
          data: {
            userId: req.userId,
            action,
            resource,
            resourceId,
            details: {
              method: req.method,
              path: req.originalUrl,
              body: req.body ? JSON.stringify(sanitizeBody(req.body)).substring(0, 1000) : null,
            },
            ipAddress: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
          },
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalEnd.apply(this, args);
    } as typeof res.end;

    next();
  };
}
