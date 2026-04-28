const ACCESS_TOKEN_KEY = 'wisebot_access_token';
const REFRESH_TOKEN_KEY = 'wisebot_refresh_token';

export const AUTH_TOKEN_REFRESHED_EVENT = 'wisebot-auth-token-refreshed';
export const AUTH_CLEARED_EVENT = 'wisebot-auth-cleared';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type StoragePreference = 'local' | 'session';

let refreshPromise: Promise<string | null> | null = null;

function getStorageForKey(key: string): Storage | null {
  if (window.localStorage.getItem(key) !== null) {
    return window.localStorage;
  }
  if (window.sessionStorage.getItem(key) !== null) {
    return window.sessionStorage;
  }
  return null;
}

export function getStoredAccessToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(tokens: TokenPair, preferredStorage?: StoragePreference) {
  const storage = preferredStorage === 'session'
    ? window.sessionStorage
    : preferredStorage === 'local'
      ? window.localStorage
      : getStorageForKey(REFRESH_TOKEN_KEY) ?? getStorageForKey(ACCESS_TOKEN_KEY) ?? window.localStorage;
  const oppositeStorage = storage === window.localStorage ? window.sessionStorage : window.localStorage;

  oppositeStorage.removeItem(ACCESS_TOKEN_KEY);
  oppositeStorage.removeItem(REFRESH_TOKEN_KEY);
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, {
    detail: { accessToken: tokens.accessToken },
  }));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string, bufferMs = 30_000) {
  const payload = parseJwtPayload(token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  if (!exp) {
    return true;
  }
  return exp * 1000 - Date.now() <= bufferMs;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      clearStoredAuth();
      return null;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearStoredAuth();
      return null;
    }

    const payload = (await response.json()) as Partial<TokenPair>;
    if (!payload.accessToken || !payload.refreshToken) {
      clearStoredAuth();
      return null;
    }

    storeTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });

    return payload.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function getValidAccessToken() {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    return null;
  }

  if (!isTokenExpiringSoon(accessToken)) {
    return accessToken;
  }

  return refreshAccessToken();
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    return response;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  });

  return response;
}
