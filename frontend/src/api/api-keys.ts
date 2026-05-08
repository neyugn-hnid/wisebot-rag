import { fetchWithAuth } from '../lib/auth';

export interface ApiKeyResponse {
  id: string;
  keyPrefix: string;
  rawKey?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

const API_KEYS_BASE = '/api/widgets';

export async function listApiKeys(widgetId: string): Promise<ApiKeyResponse[]> {
  const res = await fetchWithAuth(`${API_KEYS_BASE}/${widgetId}/api-keys`, {
    method: 'GET',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as any)?.message || `Failed to list API keys (${res.status})`);
  }
  const body = await res.json();
  return (body?.data ?? body) as ApiKeyResponse[];
}

export async function createApiKey(widgetId: string): Promise<ApiKeyResponse> {
  const res = await fetchWithAuth(`${API_KEYS_BASE}/${widgetId}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as any)?.message || `Failed to create API key (${res.status})`);
  }
  const body = await res.json();
  return (body?.data ?? body) as ApiKeyResponse;
}

export async function deleteApiKey(widgetId: string, keyId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_KEYS_BASE}/${widgetId}/api-keys/${keyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as any)?.message || `Failed to delete API key (${res.status})`);
  }
}
