import { fetchWithAuth } from '../lib/auth';


export interface CreateSessionRequest {
  tenantId: string;
  userId?: string | null;
  channel?: string;
  title?: string;
}

export interface ChatSessionResponse {
  id?: string;
  title?: string;
  lastMessageAt?: string;
  startedAt?: string;
}

export interface ChatMessageResponse {
  id?: string;
  role?: string;
  content?: string;
}

export interface AskRequest {
  question: string;
  topK?: number;
  temperature?: number;
  knowledgeBaseId?: string;
}

export interface AskResponse {
  sessionId?: unknown;
  userMessageId?: unknown;
  assistantMessageId?: unknown;
  answer?: unknown;
  citations?: unknown;
}

export interface CitationItem {
  sourceDocumentId?: unknown;
  source_document_id?: unknown;
  snippet?: unknown;
}

export interface CitationResponse {
  name: string;
  snippet: string;
}


const CHAT_BASE = '/api/chat';

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


export async function createSession(request: CreateSessionRequest): Promise<ChatSessionResponse> {
  const res = await fetchWithAuth(`${CHAT_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ChatSessionResponse>(res);
}

export async function listSessions(tenantId: string): Promise<ChatSessionResponse[]> {
  const res = await fetchWithAuth(`${CHAT_BASE}/sessions?tenantId=${encodeURIComponent(tenantId)}`);
  return handleResponse<ChatSessionResponse[]>(res);
}

export async function listMessages(sessionId: string): Promise<ChatMessageResponse[]> {
  const res = await fetchWithAuth(`${CHAT_BASE}/sessions/${sessionId}/messages`);
  return handleResponse<ChatMessageResponse[]>(res);
}


export async function ask(sessionId: string, request: AskRequest): Promise<AskResponse> {
  const res = await fetchWithAuth(`${CHAT_BASE}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<AskResponse>(res);
}

export async function getCitations(messageId: string): Promise<CitationItem[]> {
  const res = await fetchWithAuth(`${CHAT_BASE}/messages/${messageId}/citations`);
  return handleResponse<CitationItem[]>(res);
}
