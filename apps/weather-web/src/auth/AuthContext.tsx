import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthTokens } from '@weather/core';
import { auth, setTokenProvider } from '../api/client';

const STORAGE_KEY = 'skylark.tokens';

interface AuthUser {
  id: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthTokens>;
  register: (email: string, password: string) => Promise<AuthTokens>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readTokens(): AuthTokens | null {
  const raw = localStorage.getItem('skylark.tokens');
  return raw ? (JSON.parse(raw) as AuthTokens) : null;
}

function persistTokens(tokens: AuthTokens | null): void {
  if (tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function decodeUser(accessToken: string): AuthUser {
  const payload = JSON.parse(atob(accessToken.split('.')[1]!)) as { sub: string };
  return { id: payload.sub };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(readTokens);

  const update = useCallback((next: AuthTokens | null) => {
    persistTokens(next);
    setTokens(next);
  }, []);

  useEffect(() => {
    setTokenProvider({
      getAccessToken: () => tokens?.accessToken ?? null,
      refresh: async () => {
        if (!tokens) return null;
        try {
          const res = await auth.refresh(tokens.refreshToken);
          update(res.tokens);
          return res.tokens.accessToken;
        } catch {
          update(null);
          return null;
        }
      },
    });
    return () => setTokenProvider(null);
  }, [tokens, update]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: tokens ? decodeUser(tokens.accessToken) : null,
      login: async (email, password) => {
        const res = await auth.login(email, password);
        update(res.tokens);
        return res.tokens;
      },
      register: async (email, password) => {
        const res = await auth.register(email, password);
        update(res.tokens);
        return res.tokens;
      },
      logout: () => update(null),
    }),
    [tokens, update],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
