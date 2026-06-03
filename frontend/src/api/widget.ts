import { fetchWithAuth } from '../lib/auth';

// --- Types matching backend DTOs ---

export interface WidgetAppearanceConfig {
  primaryColor?: string;
  position?: 'right' | 'left';
  iconColor?: string;
  selectedIconId?: string;
  customIconUrl?: string | null;
  knowledgeBaseId?: string | null;
  topK?: number;
  temperature?: number;
}

export interface WidgetResponse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  status: string;
  welcomeMessage?: string | null;
  appearanceConfig?: WidgetAppearanceConfig | null;
  createdAt?: string;
}

export interface CreateWidgetRequest {
  tenantId: string;
  name: string;
  code: string;
  welcomeMessage?: string;
  createdBy?: string | null;
  appearanceConfig?: WidgetAppearanceConfig;
}

export interface UpdateWidgetRequest {
  name: string;
  welcomeMessage?: string;
  appearanceConfig?: WidgetAppearanceConfig;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string | null;
}

export interface ApiKeyResponse {
  id: string;
  widgetId: string;
  keyPrefix: string;
  keyHash: string | null;
  name?: string;
  status: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt?: string;
}

// --- Helper ---

const WIDGET_BASE = '/api/widget';

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

export async function listWidgets(tenantId: string): Promise<WidgetResponse[]> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets?tenantId=${encodeURIComponent(tenantId)}`);
  return handleResponse<WidgetResponse[]>(res);
}

export async function createWidget(request: CreateWidgetRequest): Promise<WidgetResponse> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<WidgetResponse>(res);
}

export async function updateWidget(id: string, request: UpdateWidgetRequest): Promise<WidgetResponse> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<WidgetResponse>(res);
}

// --- API Key functions ---

export async function listApiKeys(widgetId: string): Promise<ApiKeyResponse[]> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets/${widgetId}/api-keys`);
  return handleResponse<ApiKeyResponse[]>(res);
}

export async function createApiKey(widgetId: string, request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
  const res = await fetchWithAuth(`${WIDGET_BASE}/widgets/${widgetId}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ApiKeyResponse>(res);
}
