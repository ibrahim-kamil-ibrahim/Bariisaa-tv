import { z } from 'zod';
import {
  guestSignupSchema,
  loginSchema,
  otpLoginSchema,
  verifyOtpSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  registerDeviceSchema,
} from './auth.validation';

export type GuestSignupDto = z.infer<typeof guestSignupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type OtpLoginDto = z.infer<typeof otpLoginSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;

export interface AuthResponse {
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    name: string;
    avatarUrl?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    accountStatus?: string;
  };
  accessToken: string;
  refreshToken: string;
}
