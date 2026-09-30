import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as authService from './auth.service';
import { successResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export async function signupGuestHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, profileData } = req.body;
    const result = await authService.signupAsGuest(name, profileData);
    successResponse(res, result, 'Account created', 201);
  } catch (error) {
    next(error);
  }
}

export async function signupEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.signupWithEmail(email, password, name);
    successResponse(res, result, 'Account created. Check your email to verify.', 201);
  } catch (error) {
    next(error);
  }
}

export async function signupPhoneHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password, name } = req.body;
    const result = await authService.signupWithPhone(phone, password, name);
    successResponse(res, result, 'Account created. OTP sent to your phone.', 201);
  } catch (error) {
    next(error);
  }
}

export async function signupUsernameHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name } = req.body;
    const result = await authService.signupWithUsername(username, password, name);
    successResponse(res, result, 'Account created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function loginUsernameHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    const result = await authService.loginWithUsername(username, password, req.ip);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;
    const isEmail = !!email;
    const result = await authService.login(identifier, password, isEmail, req.ip);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function sendLoginOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    const result = await authService.sendLoginOtp(phone);
    successResponse(res, result, 'OTP sent to your phone');
  } catch (error) {
    next(error);
  }
}

export async function loginOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp } = req.body;
    const result = await authService.loginWithOtp(phone, otp);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;
    const result = await authService.verifyEmailToken(token as string);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function verifyPhoneHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { otp } = req.body;
    const result = await authService.verifyPhoneOtp(req.userId!, otp);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone } = req.body;
    const result = await authService.requestPasswordReset(email, phone);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    successResponse(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function resendEmailVerificationHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendEmailVerification(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function resendPhoneOtpHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendPhoneOtp(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function googleAuthHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;
    const result = await authService.loginWithGoogle(idToken);
    successResponse(res, result, 'Google login successful');
  } catch (error) {
    next(error);
  }
}

export async function sendProfileEmailOtpHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const result = await authService.sendProfileEmailOtp(req.userId!, email);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function verifyProfileEmailHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyProfileEmail(req.userId!, email, code);
    successResponse(res, result, 'Email verified');
  } catch (error) {
    next(error);
  }
}

export async function sendProfilePhoneOtpHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    const result = await authService.sendProfilePhoneOtp(req.userId!, phone);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function verifyProfilePhoneHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phone, code } = req.body;
    const result = await authService.verifyProfilePhone(req.userId!, phone, code);
    successResponse(res, result, 'Phone verified');
  } catch (error) {
    next(error);
  }
}

export async function upgradePasswordHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    const result = await authService.upgradePassword(req.userId!, password);
    successResponse(res, result, 'Password set successfully');
  } catch (error) {
    next(error);
  }
}
