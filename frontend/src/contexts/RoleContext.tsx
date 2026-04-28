import React, { createContext, useContext, useEffect, useState } from 'react';

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

const ACCESS_TOKEN_KEY = 'wisebot_access_token';
const REFRESH_TOKEN_KEY = 'wisebot_refresh_token';

function getAccessTokenFromStorage(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

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
    const token = getAccessTokenFromStorage();
    if (!token) {
      setRole('USER');
      setIsAuthenticated(false);
      setIsReady(true);
      return;
    }

    setRole(parseRoleFromToken(token));
    setIsAuthenticated(true);
    setIsReady(true);
  }, []);

  const syncFromAccessToken = (token: string) => {
    setRole(parseRoleFromToken(token));
    setIsAuthenticated(true);
    setIsReady(true);
  };

  const clearAuth = () => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    setRole('USER');
    setIsAuthenticated(false);
    setIsReady(true);
  };

  const logout = async () => {
    const accessToken = getAccessTokenFromStorage();

    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
