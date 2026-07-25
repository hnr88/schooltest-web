'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { AuthUser } from '@/modules/auth/types/auth.types';

async function fetchMe(): Promise<AuthUser> {
  // users-permissions returns the user object directly (not a Strapi data envelope).
  const res = await strapi.get<AuthUser>('/api/users/me');
  return res.data;
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled,
    retry: false,
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
