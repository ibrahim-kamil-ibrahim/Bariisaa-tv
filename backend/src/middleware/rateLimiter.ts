import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';

function getClientIp(req: Request): string {
  return req.ip || 'unknown';
}

function blockSuspiciousHeaders(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent'] || '';
  const blockedPatterns = [/sqlmap/i, /nikto/i, /masscan/i, /nmap/i, /gobuster/i];
  if (blockedPatterns.some((p) => p.test(userAgent))) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  next();
}

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

export const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 200,
  keyGenerator: getClientIp,
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 15 minutes.',
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many uploads, please try again later.',
  },
});

export const securityHeaders = blockSuspiciousHeaders;

// Per-user OTP rate limiter (1/min) — keyed on userId from authenticated request or IP
export const otpPerUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 1 minute before trying again.',
  },
});

