import {
  getLockoutKey,
  recordFailedAttempt,
  resetAttempts,
  isLockedOut,
} from './loginAttempts';

describe('loginAttempts utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getLockoutKey', () => {
    it('combines identifier and IP when provided', () => {
      expect(getLockoutKey('user@test.com', '10.0.0.1')).toBe('user@test.com:10.0.0.1');
    });

    it('uses only the identifier when no IP is given', () => {
      expect(getLockoutKey('user@test.com')).toBe('user@test.com');
    });
  });

  describe('recordFailedAttempt / isLockedOut', () => {
    it('does not lock before maxAttempts is reached', () => {
      const key = getLockoutKey('user@test.com');

      recordFailedAttempt(key, 5, 15);
      recordFailedAttempt(key, 5, 15);
      recordFailedAttempt(key, 5, 15);
      recordFailedAttempt(key, 5, 15);

      expect(isLockedOut(key)).toEqual({ locked: false });
    });

    it('locks the account after maxAttempts failures', () => {
      const key = getLockoutKey('user@test.com');

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(key, 5, 15);
      }

      const result = isLockedOut(key);
      expect(result.locked).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(15 * 60);
    });

    it('ignores new failures while already locked', () => {
      const key = getLockoutKey('user@test.com');

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(key, 5, 15);
      }
      // Still locked — extra attempts must not extend or change the lock
      recordFailedAttempt(key, 5, 15);

      expect(isLockedOut(key).locked).toBe(true);
    });

    it('unlocks after the lockout window expires and resets the counter', () => {
      const key = getLockoutKey('user@test.com');

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(key, 5, 15);
      }
      expect(isLockedOut(key).locked).toBe(true);

      // advance 16 minutes (lockout was 15)
      jest.advanceTimersByTime(16 * 60 * 1000);

      expect(isLockedOut(key)).toEqual({ locked: false });

      // counter was reset: 4 more failures should not lock again
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(key, 5, 15);
      }
      expect(isLockedOut(key).locked).toBe(false);
    });
  });

  describe('resetAttempts', () => {
    it('clears the counter so the account is not locked', () => {
      const key = getLockoutKey('user@test.com');

      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(key, 5, 15);
      }
      resetAttempts(key);

      expect(isLockedOut(key)).toEqual({ locked: false });

      // after reset, a fresh cycle is needed to lock
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(key, 5, 15);
      }
      expect(isLockedOut(key).locked).toBe(false);
    });
  });
});
