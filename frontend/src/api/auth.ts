import { fetchWithAuth } from '../lib/auth';

// --- Types matching backend DTOs ---

export interface LoginRequest {
  username: string; // email or username
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  fullName: string;
  username?: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface InviteRequest {
  email: string;
}

// --- Helpers ---

const AUTH_BASE = '/api/auth';

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = (body as { message?: string; error?: string; status?: number })?.message
      || (body as { error?: string })?.error
      || (response.status === 401 ? 'Email hoặc mật khẩu không đúng' : null)
      || `Request failed (${response.status})`;
    throw new AuthError(message);
  }
  const body = await response.json() as { data?: T; message?: string; error?: string; status?: number; accessToken?: string; refreshToken?: string };
  // Handle case where HTTP 200 but body contains error status
  if (body.status && body.status >= 400) {
    throw new AuthError(body.message || body.error || `Request failed (${body.status})`);
  }
  return (body.data ?? body) as T;
}

// --- API functions ---

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(request: RegisterRequest): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<{ message: string }>(res);
}

export async function refreshToken(request: RefreshTokenRequest): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<LoginResponse>(res);
}

export async function logout(): Promise<void> {
  await fetchWithAuth(`${AUTH_BASE}/logout`, {
    method: 'POST',
  });
}

export async function inviteUser(request: InviteRequest): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${AUTH_BASE}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<{ message: string }>(res);
}


export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export async function verifyEmail(request: VerifyEmailRequest): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_BASE}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<{ message: string }>(res);
}

export async function resendVerifyEmail(email: string): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_BASE}/resend-verification?email=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse<{ message: string }>(res);
}


export interface ForgotPasswordRequest {
  email: string;
  otp?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<{ message: string }>(res);
}

export async function resetPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<{ message: string }>(res);
}
