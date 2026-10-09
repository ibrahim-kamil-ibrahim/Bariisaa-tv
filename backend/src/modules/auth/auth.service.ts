import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client, LoginTicket } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';
import { createOtp, verifyOtp } from '../../utils/otp';
import { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail } from '../../utils/email';
import { sendOtpSms, sendPasswordResetSms } from '../../utils/sms';
import { getLockoutKey, isLockedOut, recordFailedAttempt, resetAttempts } from '../../utils/loginAttempts';

const BCRYPT_ROUNDS = 12;

function normalizePhone(val: string): string {
  let digits = val.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+251')) digits = digits.slice(4);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

function generateRefreshToken(userId: string, familyId: string): string {
  return jwt.sign({ userId, familyId, jti: uuidv4() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

async function createTokenPair(userId: string, familyId?: string) {
  const fid = familyId || uuidv4();
  const accessToken = generateAccessToken(userId);
  const refreshTokenValue = generateRefreshToken(userId, fid);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      familyId: fid,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

export async function getUserRoleNames(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { select: { name: true } } },
  });
  return rows.map((r) => r.role.name);
}

export async function signupWithEmail(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      emailVerified: false,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerification.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendVerificationEmail(email, token);

  const tokens = await createTokenPair(user.id);

  return {
    user,
    ...tokens,
  };
}

export async function signupAsGuest(name: string, profileData?: Record<string, any>) {
  const user = await prisma.user.create({
    data: {
      name,
      authProvider: 'guest',
      emailVerified: false,
      phoneVerified: false,
      profileData: profileData ?? {},
    },
  });

  const tokens = await createTokenPair(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
}

export async function signupWithPhone(phone: string, password: string, name: string) {
  phone = normalizePhone(phone);
  let user = await prisma.user.findUnique({ where: { phone } });

  if (user) {
    if (user.phoneVerified) throw new AppError('Phone already registered', 409);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, name },
    });
  } else {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user = await prisma.user.create({
      data: { phone, passwordHash, name, phoneVerified: false },
    });
  }

  const otpCode = await createOtp(user.id, 'phone_verification');
  await sendOtpSms(phone, otpCode);

  const tokens = await createTokenPair(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    },
    ...tokens,
  };
}

export async function signupWithUsername(username: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError('Username already taken', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name,
      emailVerified: false,
      phoneVerified: false,
    },
    select: { id: true, username: true, name: true, createdAt: true },
  });

  const tokens = await createTokenPair(user.id);

  return {
    user,
    ...tokens,
  };
}

export async function loginWithUsername(username: string, password: string, ip?: string) {
  const lockoutKey = getLockoutKey(username, ip);
  const lockout = isLockedOut(lockoutKey);
  if (lockout.locked) {
    throw new AppError(`Account locked. Try again in ${lockout.retryAfter} seconds.`, 423);
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    recordFailedAttempt(lockoutKey, env.MAX_LOGIN_ATTEMPTS, env.LOGIN_LOCKOUT_MINUTES);
    throw new AppError('Invalid username or password', 401);
  }
  if (user.status === 'BLOCKED') throw new AppError('Account is blocked', 403);
  if (user.status === 'SUSPENDED') throw new AppError('Account is suspended', 403);
  if (!user.passwordHash) throw new AppError('This account uses social login. Please sign in with Google.', 400);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(lockoutKey, env.MAX_LOGIN_ATTEMPTS, env.LOGIN_LOCKOUT_MINUTES);
    throw new AppError('Invalid username or password', 401);
  }

  resetAttempts(lockoutKey);
  const tokens = await createTokenPair(user.id);
  const roles = await getUserRoleNames(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      roles,
    },
    ...tokens,
  };
}

export async function login(identifier: string, password: string, isEmail: boolean, ip?: string) {
  const lockoutKey = getLockoutKey(identifier, ip);
  const lockout = isLockedOut(lockoutKey);
  if (lockout.locked) {
    throw new AppError(`Account locked. Try again in ${lockout.retryAfter} seconds.`, 423);
  }

  if (!isEmail) identifier = normalizePhone(identifier);
  const where = isEmail ? { email: identifier } : { phone: identifier };
  const user = await prisma.user.findFirst({ where });

  if (!user) {
    recordFailedAttempt(lockoutKey, env.MAX_LOGIN_ATTEMPTS, env.LOGIN_LOCKOUT_MINUTES);
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status === 'BLOCKED') throw new AppError('Account is blocked', 403);
  if (user.status === 'SUSPENDED') throw new AppError('Account is suspended', 403);
  if (!user.passwordHash) throw new AppError('This account uses social login. Please sign in with Google.', 400);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(lockoutKey, env.MAX_LOGIN_ATTEMPTS, env.LOGIN_LOCKOUT_MINUTES);
    throw new AppError('Invalid credentials', 401);
  }

  resetAttempts(lockoutKey);
  const tokens = await createTokenPair(user.id);
  const roles = await getUserRoleNames(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      roles,
    },
    ...tokens,
  };
}

export async function sendLoginOtp(phone: string) {
  phone = normalizePhone(phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('Phone not registered', 404);
  if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

  const otp = await createOtp(user.id, 'login');
  await sendOtpSms(phone, otp);

  return {
    message: 'OTP sent to your phone',
  };
}

export async function loginWithOtp(phone: string, otp: string) {
  phone = normalizePhone(phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('Phone not registered', 404);
  if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

  const valid = await verifyOtp(user.id, otp, 'login');
  if (!valid) throw new AppError('Invalid or expired OTP', 401);

  if (!user.phoneVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });
  }

  const tokens = await createTokenPair(user.id);
  const roles = await getUserRoleNames(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      roles,
    },
    ...tokens,
  };
}

export async function verifyEmailToken(token: string) {
  const verification = await prisma.emailVerification.findUnique({ where: { token } });

  if (!verification) throw new AppError('Invalid verification token', 400);
  if (verification.usedAt) throw new AppError('Token already used', 400);
  if (verification.expiresAt < new Date()) throw new AppError('Token expired', 400);

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
  ]);

  return { message: 'Email verified successfully' };
}

export async function verifyPhoneOtp(userId: string, otp: string) {
  const valid = await verifyOtp(userId, otp, 'phone_verification');
  if (!valid) throw new AppError('Invalid or expired OTP', 401);

  await prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: true },
  });

  return { message: 'Phone verified successfully' };
}

export async function requestPasswordReset(email?: string, phone?: string) {
  let user;
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
  } else if (phone) {
    phone = normalizePhone(phone);
    user = await prisma.user.findUnique({ where: { phone } });
  }

  if (!user) return { message: 'If the account exists, a reset link has been sent' };

  if (email && user.email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    await sendPasswordResetEmail(user.email, token);
  }

  if (phone && user.phone) {
    const otp = await createOtp(user.id, 'password_reset', 15);
    await sendPasswordResetSms(user.phone, otp);
  }

  return { message: 'If the account exists, a reset link has been sent' };
}

export async function resetPassword(token: string, newPassword: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { token } });

  if (!reset) throw new AppError('Invalid reset token', 400);
  if (reset.usedAt) throw new AppError('Token already used', 400);
  if (reset.expiresAt < new Date()) throw new AppError('Token expired', 400);

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: 'Password reset successfully' };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  try {
    jwt.verify(refreshTokenValue, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: { select: { status: true } } },
  });

  if (!storedToken) {
    throw new AppError('Refresh token not found', 401);
  }
  if (storedToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token reuse detected. All sessions revoked.', 401);
  }
  if (storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }
  if (storedToken.user.status !== 'ACTIVE') {
    throw new AppError('Account is not active', 403);
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await createTokenPair(storedToken.userId, storedToken.familyId);

  return tokens;
}

export async function logout(refreshTokenValue: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshTokenValue, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { message: 'Logged out successfully' };
}

export async function resendEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.email) throw new AppError('User not found', 404);
  if (user.emailVerified) throw new AppError('Email already verified', 400);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerification.create({
    data: { userId, token, expiresAt },
  });

  await sendVerificationEmail(user.email, token);

  return { message: 'Verification email sent' };
}

export async function resendPhoneOtp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.phone) throw new AppError('User not found', 404);
  if (user.phoneVerified) throw new AppError('Phone already verified', 400);

  const otp = await createOtp(userId, 'phone_verification');
  await sendOtpSms(user.phone, otp);

  return { message: 'OTP sent' };
}

// ── Profile: add/verify email & phone (kid-safe "level up" flow) ──────────

export async function sendProfileEmailOtp(userId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.emailVerified && user.email === email) {
    throw new AppError('This email is already verified', 400);
  }

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken && emailTaken.id !== userId) {
    throw new AppError('This email is already in use by another account', 409);
  }

  const otpCode = await createOtp(userId, 'email_verification');
  await sendOtpEmail(email, otpCode);

  // Stash the pending email so verify knows what to confirm.
  await prisma.user.update({
    where: { id: userId },
    data: { pendingEmail: email },
  });

  return {
    message: 'Verification code sent to your email',
  };
}

export async function verifyProfileEmail(userId: string, email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const expected = user.pendingEmail ?? user.email;
  if (expected !== email) {
    throw new AppError('This email does not match the code we sent', 400);
  }

  const valid = await verifyOtp(userId, code, 'email_verification');
  if (!valid) throw new AppError('Invalid or expired code', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerified: true, pendingEmail: null },
  });

  return { message: 'Email verified successfully' };
}

export async function sendProfilePhoneOtp(userId: string, phone: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const normalized = normalizePhone(phone);
  if (user.phoneVerified && user.phone === normalized) {
    throw new AppError('This phone number is already verified', 400);
  }

  const phoneTaken = await prisma.user.findUnique({ where: { phone: normalized } });
  if (phoneTaken && phoneTaken.id !== userId) {
    throw new AppError('This phone number is already in use by another account', 409);
  }

  const otpCode = await createOtp(userId, 'phone_verification');
  await sendOtpSms(normalized, otpCode);

  await prisma.user.update({
    where: { id: userId },
    data: { pendingPhone: normalized },
  });

  return {
    message: 'Verification code sent via SMS',
  };
}

export async function verifyProfilePhone(userId: string, phone: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const expected = user.pendingPhone ?? user.phone;
  const normalized = normalizePhone(phone);
  if (expected !== normalized) {
    throw new AppError('This phone number does not match the code we sent', 400);
  }

  const valid = await verifyOtp(userId, code, 'phone_verification');
  if (!valid) throw new AppError('Invalid or expired code', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { phone: normalized, phoneVerified: true, pendingPhone: null },
  });

  return { message: 'Phone verified successfully' };
}

export async function upgradePassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (!user.emailVerified && !user.phoneVerified) {
    throw new AppError('Email or phone must be verified before setting a password', 403);
  }
  if (user.passwordHash) {
    throw new AppError('Password already set', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password set successfully' };
}

export async function loginWithGoogle(idToken: string) {
  const clientIds = env.GOOGLE_CLIENT_IDS
    ? env.GOOGLE_CLIENT_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [];

  if (clientIds.length === 0) {
    throw new AppError('Google Sign-In is not configured on the server', 500);
  }

  let ticket: LoginTicket | null = null;

  for (const clientId of clientIds) {
    try {
      const client = new OAuth2Client(clientId);
      ticket = await client.verifyIdToken({ idToken, audience: clientId });
      break;
    } catch {
      continue;
    }
  }

  if (!ticket) {
    throw new AppError('Invalid Google ID token', 401);
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new AppError('Invalid Google ID token payload', 401);
  }

  const email = payload.email;
  const name = payload.name;
  const picture = payload.picture;

  if (!email) {
    throw new AppError('Google account must have an email address', 400);
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.status === 'BLOCKED') throw new AppError('Account is blocked', 403);
    if (user.status === 'SUSPENDED') throw new AppError('Account is suspended', 403);

    if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }
    if (picture && !user.avatarUrl) {
      await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: picture } });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        avatarUrl: picture || null,
        authProvider: 'google',
        emailVerified: true,
      },
    });
  }

  const tokens = await createTokenPair(user.id);
  const roles = await getUserRoleNames(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      roles,
    },
    ...tokens,
  };
}
