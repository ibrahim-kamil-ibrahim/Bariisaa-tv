const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  if (err && typeof err === 'object' && 'message' in err) return new Error(String((err as { message: unknown }).message));
  console.error('[OAuth API] Unexpected throw value:', err);
  return new Error('Request failed');
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch (err) {
    console.error(`[OAuth API] GET ${path} network error:`, err);
    throw toError(err);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    console.error(`[OAuth API] GET ${path} failed:`, response.status, body);
    throw new Error(body.message || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[OAuth API] POST ${path} network error:`, err);
    throw toError(err);
  }

  if (!response.ok) {
    const body2 = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    console.error(`[OAuth API] POST ${path} failed:`, response.status, body2);
    throw new Error(body2.message || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  name: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function loginWithEmail(body: { email: string; password: string }): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/login', body);
}

export function loginWithPhone(body: { phone: string; password: string }): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/login', body);
}

export function sendLoginOtp(body: { phone: string }): Promise<{ message: string; devOtp?: string }> {
  return apiPost<{ message: string; devOtp?: string }>('/auth/login/send-otp', body);
}

export function loginOtp(body: { phone: string; otp: string }): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/login/otp', body);
}

export function signupEmail(body: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; email: string; name: string; createdAt: string }> {
  return apiPost('/auth/signup/email', body);
}

export function signupPhone(body: {
  name: string;
  phone: string;
  password: string;
}): Promise<AuthSession & { devOtp?: string }> {
  return apiPost('/auth/signup/phone', body);
}

export function verifyPhone(body: { otp: string }, token: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/verify-phone', body, token);
}

export function resendPhoneOtp(token: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/resend-phone-otp', {}, token);
}

export function forgotPassword(body: { email?: string; phone?: string }): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/forgot-password', body);
}

export function resetPassword(body: { token: string; newPassword: string }): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', body);
}

export function googleLogin(body: { idToken: string }): Promise<AuthSession> {
  return apiPost<AuthSession>('/auth/google', body);
}
