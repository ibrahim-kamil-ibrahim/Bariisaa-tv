import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  guestSignupSchema,
  emailSignupSchema,
  phoneSignupSchema,
  usernameSignupSchema,
  usernameLoginSchema,
  loginSchema,
  sendLoginOtpSchema,
  otpLoginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleAuthSchema,
  sendProfileOtpSchema,
  verifyProfileEmailSchema,
  sendProfilePhoneOtpSchema,
  verifyProfilePhoneSchema,
  upgradePasswordSchema,
} from './auth.validation';
import { authLimiter, authSpeedLimiter, otpLimiter, otpPerUserLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

// Guest signup (replaces old email/phone + OTP flow)
router.post('/signup/guest', authLimiter, validate(guestSignupSchema), authController.signupGuestHandler);

// Email signup
router.post('/signup/email', authLimiter, validate(emailSignupSchema), authController.signupEmailHandler);

// Phone signup
router.post('/signup/phone', authLimiter, validate(phoneSignupSchema), authController.signupPhoneHandler);

// Username signup
router.post('/signup/username', authLimiter, validate(usernameSignupSchema), authController.signupUsernameHandler);

// Login
router.post('/login', authLimiter, authSpeedLimiter, validate(loginSchema), authController.loginHandler);

// Username login
router.post('/login/username', authLimiter, authSpeedLimiter, validate(usernameLoginSchema), authController.loginUsernameHandler);
router.post('/login/send-otp', otpPerUserLimiter, validate(sendLoginOtpSchema), authController.sendLoginOtpHandler);
router.post('/login/otp', authLimiter, authSpeedLimiter, validate(otpLoginSchema), authController.loginOtpHandler);
router.post('/google', authLimiter, authSpeedLimiter, validate(googleAuthSchema), authController.googleAuthHandler);

// Email/Phone verification (existing users)
router.get('/verify-email', authLimiter, authController.verifyEmailHandler);
router.post('/verify-phone', authenticate, validate(verifyOtpSchema), authController.verifyPhoneHandler);

// Profile: add/verify email (post-signup)
router.post('/profile/email/send-otp', authenticate, otpPerUserLimiter, validate(sendProfileOtpSchema), authController.sendProfileEmailOtpHandler);
router.post('/profile/email/verify', authenticate, validate(verifyProfileEmailSchema), authController.verifyProfileEmailHandler);

// Profile: add/verify phone (post-signup)
router.post('/profile/phone/send-otp', authenticate, otpPerUserLimiter, validate(sendProfilePhoneOtpSchema), authController.sendProfilePhoneOtpHandler);
router.post('/profile/phone/verify', authenticate, validate(verifyProfilePhoneSchema), authController.verifyProfilePhoneHandler);

// Password reset
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPasswordHandler);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPasswordHandler);

// Token management
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), authController.refreshTokenHandler);
router.post('/logout', validate(refreshTokenSchema), authController.logoutHandler);

// Resend verification
router.post('/resend-email-verification', authenticate, authController.resendEmailVerificationHandler);
router.post('/resend-phone-otp', authenticate, otpPerUserLimiter, authController.resendPhoneOtpHandler);

// Upgrade/set password (requires verified email or phone)
router.post('/upgrade/password', authenticate, validate(upgradePasswordSchema), authController.upgradePasswordHandler);

export default router;
