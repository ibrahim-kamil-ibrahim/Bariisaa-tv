import crypto from 'crypto';
import { timingSafeEqual } from 'crypto';
import prisma from '../config/database';

const otpCache = new Map<string, { code: string; expiresAt: number }>();

function pruneExpiredCache() {
  const now = Date.now();
  for (const [key, val] of otpCache) {
    if (val.expiresAt < now) otpCache.delete(key);
  }
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createOtp(userId: string, purpose: string, expiresInMinutes = 5): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const requestId = `${userId}:${purpose}:${Date.now()}`;

  // Cache the plaintext code keyed by requestId (expires with the OTP)
  otpCache.set(requestId, { code, expiresAt: expiresAt.getTime() });
  pruneExpiredCache();

  // Store the SHA-256 hash in the database
  await prisma.otpCode.create({
    data: {
      userId,
      code: hashOtp(code),
      purpose,
      expiresAt,
    },
  });

  return code;
}

export function getCachedOtp(requestId: string): string | null {
  const cached = otpCache.get(requestId);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    otpCache.delete(requestId);
    return null;
  }
  return cached.code;
}

export function invalidateCachedOtp(requestId: string): void {
  otpCache.delete(requestId);
}

export function clearOtpCache(): void {
  otpCache.clear();
}

export async function verifyOtp(userId: string, code: string, purpose: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return false;

  if (otp.attempts >= 5) {
    return false;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  const inputHash = hashOtp(code);
  const storedHashBuf = Buffer.from(otp.code, 'utf8');
  const inputHashBuf = Buffer.from(inputHash, 'utf8');
  if (storedHashBuf.length !== inputHashBuf.length || !timingSafeEqual(storedHashBuf, inputHashBuf)) {
    return false;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return true;
}
