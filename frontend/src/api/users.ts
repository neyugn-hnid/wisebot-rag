import { fetchWithAuth } from '../lib/auth';

// --- Types matching backend DTOs ---

export interface UserResponse {
  id: string;
  avatarUrl?: string | null;
  fullName: string;
  username?: string;
  email: string;
  phone?: string | null;
  role?: string;
  status?: 'ACTIVE' | 'DISABLED' | 'PENDING';
  lastLogin?: string | null;
  createdAt?: string;
}

export interface UserPageResponse {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  users: UserResponse[];
}

export interface UserListParams {
  keyword?: string;
  role?: string;
  status?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export interface AdminUserUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: 'ACTIVE' | 'DISABLED' | 'PENDING';
}

export interface ChangeStatusRequest {
  newStatus: 'ACTIVE' | 'DISABLED' | 'PENDING';
}

export interface ProfileUpdateRequest {
  fullName: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

// --- Helper ---

const USER_BASE = '/api/user';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = (body as { message?: string; error?: string })?.message
      || (body as { error?: string })?.error
      || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  const body = await response.json() as { data?: T; message?: string };
  return (body.data ?? body) as T;
}

// --- API functions ---

export async function listUsers(params: UserListParams = {}): Promise<UserPageResponse> {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));

  const res = await fetchWithAuth(`${USER_BASE}/list?${query.toString()}`);
  return handleResponse<UserPageResponse>(res);
}

export async function getUser(id: string): Promise<UserResponse> {
  const res = await fetchWithAuth(`${USER_BASE}/${id}`);
  return handleResponse<UserResponse>(res);
}

export async function adminUpdateUser(id: string, request: AdminUserUpdateRequest): Promise<void> {
  const res = await fetchWithAuth(`${USER_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Update failed: ${res.status}`);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`${USER_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Delete failed: ${res.status}`);
  }
}

export async function changeUserStatus(id: string, newStatus: ChangeStatusRequest['newStatus']): Promise<void> {
  const res = await fetchWithAuth(`${USER_BASE}/${id}/change-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Status change failed: ${res.status}`);
  }
}

// --- Profile APIs ---

export async function getProfile(): Promise<UserResponse> {
  const res = await fetchWithAuth(`${USER_BASE}/profile`);
  return handleResponse<UserResponse>(res);
}

export async function updateProfile(request: ProfileUpdateRequest): Promise<void> {
  const res = await fetchWithAuth(`${USER_BASE}/update-profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Update failed: ${res.status}`);
  }
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  const res = await fetchWithAuth(`${USER_BASE}/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Password change failed: ${res.status}`);
  }
}
