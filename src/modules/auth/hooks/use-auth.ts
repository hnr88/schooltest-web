'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
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
    // Sign-out must not leave authenticated traffic in the air: mounted queries
    // outside the auth module (the notifications poll among them) keep
    // refetching with the dead token until their screen unmounts, and every
    // refetch storms the console with 401/403. Cancel what is in flight and
    // drop every cached server payload — not just ['auth','me'] — so nothing
    // signed-in survives the token (privacy as much as noise). Observers that
    // are still mounted refetch once more at most, and the caller's redirect
    // to /sign-in unmounts them inside that window.
    void queryClient.cancelQueries();
    queryClient.removeQueries();
    router.refresh();
  };

  return {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: !hydrated || (Boolean(token) && meQuery.isPending),
    logout,
  };
}
