'use client';

import { useQuery } from '@tanstack/react-query';

import {
  sectionTimersSchema,
  timerMinutesFromSeconds,
  type TimerSection,
} from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { SECTION_TIMERS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';
import {
  sectionTimersMetaSchema,
  type SectionTimersMeta,
} from '@/modules/ops/schemas/section-timers.schema';

// OPS-080, C-OPS-PORTAL-070 GET /api/config/section-timers. The ONE read the
// ops Timers screen runs (task 02 collapsed the former unversioned duplicate):
// the durations come from the contract GET (sent as a VERSIONED request, so the
// server projects and range-checks the active row) and are parsed through the
// SHARED schema, so a shape the server never promised cannot reach the screen.
// version/updated_by/updated_at come from the active Config row via its core
// find — the same existing metadata read the screen has always used, not a new
// endpoint and not an invented default.

/**
 * One row of the active configuration. `minutes` is null when the stored
 * seconds cannot be shown as whole minutes in 1..60 — the screen then shows the
 * honest seconds and asks for a corrected value instead of rounding a number
 * nobody chose.
 */
export interface TimersReadSection extends TimerSection {
  minutes: number | null;
}

export interface TimersReadState {
  sections: TimersReadSection[];
  meta: SectionTimersMeta | null;
}

const byStage = (a: TimerSection, b: TimerSection) => a.stage - b.stage;

async function fetchTimersRead(): Promise<TimersReadState> {
  const [timersRes, configRes] = await Promise.all([
    strapi.get<unknown>('/api/config/section-timers', { opsPortalVersioned: true }),
    strapi.get<StrapiCollectionResponse<unknown>>('/api/configs', {
      params: {
        'filters[active][$eq]': 'true',
        'fields[0]': 'version',
        'fields[1]': 'section_timers',
      },
    }),
  ]);
  // The shared schema is strict and demands stages 1, 2 and 3 exactly once, so
  // two rows for stage 1 and none for stage 3 is an error state rather than a
  // console that silently lost a section. parseDataEnvelope raises
  // RestContractViolation on any other drift.
  const { sections } = parseDataEnvelope(sectionTimersSchema, timersRes.data);
  const meta = sectionTimersMetaSchema.safeParse(configRes.data.data[0]);
  return {
    sections: [...sections].sort(byStage).map((section) => ({
      ...section,
      minutes: timerMinutesFromSeconds(section.duration_seconds),
    })),
    meta: meta.success ? meta.data : null,
  };
}

/**
 * Shares SECTION_TIMERS_QUERY_KEY with the existing save mutation on purpose:
 * a successful PUT invalidates that key, so the screen re-reads through this
 * contract-validated query rather than trusting the value it just posted.
 */
export function useSectionTimersQuery(enabled: boolean) {
  return useQuery({
    queryKey: SECTION_TIMERS_QUERY_KEY,
    queryFn: fetchTimersRead,
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
