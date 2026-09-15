'use client';

import { useQuery } from '@tanstack/react-query';

import { restFailureOf, strapi } from '@/lib/axios/strapi';
import type { AuthUser } from '@/modules/auth/types/auth.types';

async function fetchMe(): Promise<AuthUser> {
  // users-permissions returns the user object directly (not a Strapi data envelope).
  const res = await strapi.get<AuthUser>('/api/users/me');
  return res.data;
}

/**
 * NIGHT-2 (W-R3, SA surfaces): does this me-query rejection REALLY mean "not
 * signed in"? Only a 401 (dead token — the axios boundary already cleared it)
 * or an unauthenticated 403 ends a session. A transport reset, a 429 whose
 * ride-out window exhausted, or a 5xx contract failure during an API recompile
 * are all TRANSIENT: treating them as sign-outs bounced authenticated admins
 * off every portal surface (observed live: sign-in 200, dashboard reached,
 * then the guard's me fetch hiccuped once and the portal ejected the user to
 * the login form). The guards keep the skeleton up for those, and the bounded
 * retry below — or the next mount — recovers.
 */
export function isAuthRejection(error: unknown): boolean {
  const kind = restFailureOf(error)?.kind;
  return kind === 'auth-invalid' || kind === 'auth-missing';
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled,
    // A dead session fails fast (isAuthRejection skips the retries). Every
    // other failure gets two spaced attempts so a single dropped response
    // during a Strapi hot-recompile no longer flips isError.
    retry: (failureCount, error) => !isAuthRejection(error) && failureCount < 2,
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 6000),
    // An errored me query (e.g. expired JWT) re-fetches on EVERY new observer
    // mount unless retryOnMount is false. Each refetch flips status back to
    // pending, the dashboard onboarding guard re-enters its skeleton and
    // unmounts the tree, the settle remounts it — a mount/fetch loop firing
    // ~400 req/s that blanks the dashboard and storms the API rate limiter.
    // refetchOnMount must STAY on for stale queries though: login seeds the
    // cache with the /api/auth/local user, which carries no `role` — only the
    // populated GET /api/users/me does, and the onboarding guard's parent
    // check depends on it. Stale-data refetches are one-shot (staleTime keeps
    // the result fresh), so they cannot loop like the error path did.
    retryOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
}
