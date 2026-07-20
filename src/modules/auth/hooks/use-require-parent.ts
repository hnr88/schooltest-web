'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

// Client guard primitive for parent-only routes (D11): hydrates the auth
// store from localStorage, then redirects to /sign-in once hydration
// completes without a JWT. Consumers render a loading state until isReady.
export function useRequireParent() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) router.replace('/sign-in');
  }, [hydrated, token, router]);

  return { isReady: hydrated && Boolean(token), isAuthenticated: Boolean(token) };
}
