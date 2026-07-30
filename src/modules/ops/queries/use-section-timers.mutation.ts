'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { SECTION_TIMERS_QUERY_KEY } from '@/modules/ops/queries/use-section-timers.query';
import {
  sectionTimersSchema,
  type SectionTimers,
  type TimerSection,
} from '@/modules/ops/schemas/section-timers.schema';

// C-TMR-01 PUT (ops only): every accepted write lands as a NEW versioned
// Config row server-side - never retroactive, sittings keep their snapshot.
async function putSectionTimers(sections: TimerSection[]): Promise<SectionTimers> {
  const res = await strapi.put<{ data: unknown }>('/api/config/section-timers', {
    data: { sections },
  });
  return sectionTimersSchema.parse(res.data.data);
}

export function useSectionTimersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putSectionTimers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SECTION_TIMERS_QUERY_KEY }),
  });
}
