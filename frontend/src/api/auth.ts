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
    const message = (body as { message?: string; error?: string })?.message
      || (body as { error?: string })?.error
      || `Request failed: ${response.status}`;
    throw new AuthError(message);
  }
  const body = await response.json() as { data?: T; message?: string; accessToken?: string; refreshToken?: string };
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
