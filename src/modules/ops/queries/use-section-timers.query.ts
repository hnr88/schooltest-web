'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import {
  sectionTimersMetaSchema,
  sectionTimersSchema,
  type SectionTimersMeta,
  type TimerSection,
} from '@/modules/ops/schemas/section-timers.schema';

import type { SectionTimersState } from '@/modules/ops/types/queries.types';
import { SECTION_TIMERS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-TMR-01: the values come from the contract GET; the who/when/version come
// from the active Config row via its core find (ops holds the CONFIG read
// grant) - both are existing routes, no new GET.
async function fetchSectionTimers(): Promise<SectionTimersState> {
  const [timersRes, configRes] = await Promise.all([
    strapi.get<{ data: unknown }>('/api/config/section-timers'),
    strapi.get<StrapiCollectionResponse<unknown>>('/api/configs', {
      params: {
        'filters[active][$eq]': 'true',
        'fields[0]': 'version',
        'fields[1]': 'section_timers',
      },
    }),
  ]);
  const sections = sectionTimersSchema.parse(timersRes.data.data).sections;
  const meta = sectionTimersMetaSchema.safeParse(configRes.data.data[0]);
  return { sections, meta: meta.success ? meta.data : null };
}

export function useSectionTimersQuery(enabled: boolean) {
  return useQuery({
    queryKey: SECTION_TIMERS_QUERY_KEY,
    queryFn: fetchSectionTimers,
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
