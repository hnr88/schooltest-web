'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

/**
 * Single entry point for auth state + actions. Hydrates the token from
 * localStorage on mount, exposes the current user (server state via useMeQuery),
 * and a logout action. Build UI on top of this — the module ships no components.
 */
export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const setToken = useAuthStore((state) => state.setToken);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const meQuery = useMeQuery(hydrated && Boolean(token));

  const logout = () => {
    setToken(null);
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    router.refresh();
  };

  return {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: !hydrated || (Boolean(token) && meQuery.isPending),
    logout,
  };
}
