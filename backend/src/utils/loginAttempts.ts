interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

export function getLockoutKey(identifier: string, ip?: string): string {
  return ip ? `${identifier}:${ip}` : identifier;
}

export function recordFailedAttempt(key: string, maxAttempts: number, lockoutMinutes: number): void {
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, lockedUntil: null };

  if (record.lockedUntil && record.lockedUntil > now) {
    return;
  }

  record.count += 1;

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockoutMinutes * 60 * 1000;
    record.count = 0;
  }

  attempts.set(key, record);
}

export function resetAttempts(key: string): void {
  attempts.delete(key);
}

export function isLockedOut(key: string): { locked: boolean; retryAfter?: number } {
  const record = attempts.get(key);
  if (!record || !record.lockedUntil) return { locked: false };

  const now = Date.now();
  if (record.lockedUntil > now) {
    return { locked: true, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  record.lockedUntil = null;
  record.count = 0;
  return { locked: false };
}
