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
    staleTime: 5 * 60 * 1000,
  });
}
