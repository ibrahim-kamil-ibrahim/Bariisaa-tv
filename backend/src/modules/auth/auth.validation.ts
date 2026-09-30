import { z } from 'zod';

const phoneSchema = z.string().refine(
  (val) => /^(\+?\d{7,15})$/.test(val.replace(/[\s\-()]/g, '')),
  { message: 'Invalid phone number' }
);

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const guestSignupSchema = z.object({
  name: z.string().min(2).max(100),
  profileData: z.record(z.any()).optional(),
});

export const emailSignupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(2).max(100),
});

export const phoneSignupSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export const sendLoginOtpSchema = z.object({
  phone: phoneSchema,
});

export const otpLoginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6),
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const registerDeviceSchema = z.object({
  deviceUid: z.string(),
  deviceName: z.string(),
  platform: z.enum(['ANDROID', 'IOS', 'WEB']),
  osVersion: z.string().optional(),
  fcmToken: z.string().optional(),
});

export const usernameSignupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: passwordSchema,
  name: z.string().min(2).max(100),
});

export const usernameLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const sendProfileOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyProfileEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const sendProfilePhoneOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyProfilePhoneSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
});

export const upgradePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/\d/, 'Password must contain at least one number'),
});
