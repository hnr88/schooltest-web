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
    // mount unless retryOnMount is false (refetchOnMount only gates queries that
    // already hold data). Each refetch flips status back to pending, the
    // dashboard onboarding guard re-enters its skeleton and unmounts the tree,
    // the settle remounts it — a mount/fetch loop firing ~400 req/s that blanks
    // the dashboard and storms the API rate limiter. The query is fresh by
    // staleTime and explicitly set/removed on login/logout, so mounts reuse it.
    retryOnMount: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
}
