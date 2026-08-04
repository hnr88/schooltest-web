'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { teachHomeSchema } from '@/modules/teach/schemas/teach-home.schema';
import type { TeachHome } from '@/modules/teach/types/teach-home.types';

import type { UseTeachHomeQueryOptions } from '@/modules/teach/types/queries.types';

export const TEACH_HOME_QUERY_KEY = ['teach', 'home'] as const;

// C-TEACH-01 teach home (task 83): the server enforces the role gate
// (teacher | school_admin) and the class scope (teacher sees own classes,
// school_admin sees all school classes), so the client renders whatever the
// caller is entitled to. Poll cadence is decided by the landing screen
// (task 84), not here.
async function fetchTeachHome(): Promise<TeachHome> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>('/api/schools/me/teach/home');
  return teachHomeSchema.parse(res.data.data);
}

export function useTeachHomeQuery(options?: UseTeachHomeQueryOptions) {
  return useQuery({
    queryKey: TEACH_HOME_QUERY_KEY,
    queryFn: fetchTeachHome,
    refetchInterval: options?.refetchInterval
      ? (query) => options.refetchInterval?.(query.state.data)
      : undefined,
  });
}
