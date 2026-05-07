import { fetchWithAuth } from '../lib/auth';

export interface ApiKeyResponse {
  id: string;
  widgetId: string;
  keyPrefix: string;
  keyHash: string;
  status: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface CreateApiKeyRequest {
  expiresAt?: string;
}

const WIDGET_BASE = '/api/widget';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Request failed: ${response.status}`);
  }
  const body = await response.json() as { data?: T; message?: string };
  return (body.data ?? body) as T;
}

export async function listApiKeys(widgetId: string): Promise<ApiKeyResponse[]> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets/${widgetId}/api-keys`);
  return handleResponse<ApiKeyResponse[]>(res);
}

export async function createApiKey(widgetId: string, request?: CreateApiKeyRequest): Promise<ApiKeyResponse & { rawKey?: string }> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets/${widgetId}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request || {}),
  });
  return handleResponse<ApiKeyResponse & { rawKey?: string }>(res);
}
