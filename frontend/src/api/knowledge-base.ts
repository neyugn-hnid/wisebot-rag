import { fetchWithAuth } from '../lib/auth';


export interface KnowledgeBaseResponse {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  createdAt?: string;
}

export interface KnowledgeBaseRequest {
  name: string;
  description?: string;
}

export type DocumentStatus = 'UPLOADED' | 'PROCESSED' | 'FAILED';

export interface DocumentResponse {
  id: string;
  knowledgeBaseId: string;
  filename: string;
  contentType?: string;
  size?: number;
  status: DocumentStatus;
  createdAt?: string;
}


const KB_BASE = '/api/knowledge-bases';
const DOC_BASE = '/api/documents';

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


export async function listKnowledgeBases(): Promise<KnowledgeBaseResponse[]> {
  const res = await fetchWithAuth(KB_BASE);
  return handleResponse<KnowledgeBaseResponse[]>(res);
}

export async function createKnowledgeBase(request: KnowledgeBaseRequest): Promise<KnowledgeBaseResponse> {
  const res = await fetchWithAuth(KB_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<KnowledgeBaseResponse>(res);
}

export async function updateKnowledgeBase(id: string, request: KnowledgeBaseRequest): Promise<KnowledgeBaseResponse> {
  const res = await fetchWithAuth(`${KB_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<KnowledgeBaseResponse>(res);
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const res = await fetchWithAuth(`${KB_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Delete failed: ${res.status}`);
  }
}


export async function listDocuments(knowledgeBaseId: string): Promise<DocumentResponse[]> {
  const res = await fetchWithAuth(`${KB_BASE}/${knowledgeBaseId}/documents`);
  return handleResponse<DocumentResponse[]>(res);
}

export async function uploadDocument(knowledgeBaseId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetchWithAuth(`${KB_BASE}/${knowledgeBaseId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Upload failed: ${res.status}`);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetchWithAuth(`${DOC_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Delete failed: ${res.status}`);
  }
}

export async function reprocessDocument(id: string): Promise<void> {
  const res = await fetchWithAuth(`${DOC_BASE}/${id}/reprocess`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { message?: string })?.message || `Reprocess failed: ${res.status}`);
  }
}

export async function previewDocument(id: string): Promise<string> {
  const res = await fetchWithAuth(`${DOC_BASE}/${id}/preview`);
  return handleResponse<string>(res);
}
