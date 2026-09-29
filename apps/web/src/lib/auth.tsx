'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@share-car/api-client';
import { api, AUTH_LOGOUT_EVENT, tokenStore } from './api';

interface AuthContextValue {
  user: User | null;
  /** true cho tới khi biết chắc người dùng đã đăng nhập hay chưa */
  isLoading: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_QUERY_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setToken(tokenStore.get());
    setHydrated(true);
  }, []);

  const me = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => (await api.GET('/auth/me')).data!,
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });

  const signOut = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const signIn = useCallback(
    (newToken: string, user: User) => {
      tokenStore.set(newToken);
      queryClient.clear();
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setToken(newToken);
    },
    [queryClient],
  );

  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, signOut);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, signOut);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? (me.data ?? null) : null,
      isLoading: !hydrated || (!!token && me.isPending),
      signIn,
      signOut,
    }),
    [token, me.data, me.isPending, hydrated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
}
