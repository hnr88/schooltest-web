'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
// NIGHT-2 AUTH-018: the anonymous bounce carries the attempted route
// so sign-in can return the visitor to where they were heading.
import { signInHref } from '@/modules/auth/lib/sign-in-redirect';

// Client guard primitive for parent-only routes (D11): hydrates the auth
// store from localStorage, then redirects to /sign-in once hydration
// completes without a JWT. Consumers render a loading state until isReady.
export function useRequireParent() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) router.replace(signInHref(pathname));
  }, [hydrated, pathname, token, router]);

  return { isReady: hydrated && Boolean(token), isAuthenticated: Boolean(token) };
}
