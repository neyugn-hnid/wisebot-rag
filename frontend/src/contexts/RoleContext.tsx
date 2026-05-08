import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AUTH_CLEARED_EVENT,
  AUTH_TOKEN_REFRESHED_EVENT,
  clearStoredAuth,
  fetchWithAuth,
  getStoredAccessToken,
} from '../lib/auth';

type Role = 'ADMIN' | 'OWNER' | 'USER';

interface RoleContextType {
  role: Role;
  isAuthenticated: boolean;
  isReady: boolean;
  setRole: (role: Role) => void;
  syncFromAccessToken: (token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function parseRoleFromToken(token: string): Role {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return 'USER';
    }

    const payloadText = decodeBase64Url(payloadSegment);
    const payload = JSON.parse(payloadText) as { role?: string[] | string };
    const rawRoles = Array.isArray(payload.role)
      ? payload.role
      : payload.role
        ? [payload.role]
        : [];

    const normalizedRoles = rawRoles
      .map((value) => value.toUpperCase().replace('ROLE_', ''));

    if (normalizedRoles.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (normalizedRoles.includes('OWNER')) {
      return 'OWNER';
    }
    return 'USER';
  } catch {
    return 'USER';
  }
}

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>('ADMIN');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setRole('USER');
      setIsAuthenticated(false);
      setIsReady(true);
      return;
    }

    setRole(parseRoleFromToken(token));
    setIsAuthenticated(true);
    setIsReady(true);

    const handleTokenRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<{ accessToken?: string }>;
      const nextToken = customEvent.detail?.accessToken;
      if (nextToken) {
        syncFromAccessToken(nextToken);
      }
    };

    const handleAuthCleared = () => {
      setRole('USER');
      setIsAuthenticated(false);
      setIsReady(true);
    };

    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefreshed as EventListener);
    window.addEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);

    return () => {
      window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefreshed as EventListener);
      window.removeEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
    };
  }, []);

  const syncFromAccessToken = (token: string) => {
    if (!token || typeof token !== 'string') {
      clearAuth();
      return;
    }
    try {
      setRole(parseRoleFromToken(token));
      setIsAuthenticated(true);
      setIsReady(true);
    } catch {
      clearAuth();
    }
  };

  const clearAuth = () => {
    clearStoredAuth();
    setRole('USER');
    setIsAuthenticated(false);
    setIsReady(true);
  };

  const logout = async () => {
    const accessToken = getStoredAccessToken();

    try {
      if (accessToken) {
        await fetchWithAuth('/api/auth/logout', {
          method: 'POST',
        });
      }
    } finally {
      clearAuth();
    }
  };
  
  return (
    <RoleContext.Provider value={{ role, isAuthenticated, isReady, setRole, syncFromAccessToken, clearAuth, logout }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
