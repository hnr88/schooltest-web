'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  sittingActivityFeedSchema,
  sittingActivityLimitDefault,
  type SittingActivityFeed,
} from '@/modules/teacher/schemas/teacher-session.schema';
import { SITTING_ACTIVITY_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';

// C-SIT-ACTIVITY (teacher task 13) — the sitting-scoped session activity
// trail: newest entries plus `total` over the WHOLE trail, so the panel can
// say "the last 8 of N". The envelope is the sittings `{ data }` one.
async function fetchSittingActivity(sittingDocumentId: string): Promise<SittingActivityFeed> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/sittings/${sittingDocumentId}/activity`,
    { params: { limit: sittingActivityLimitDefault } },
  );
  return sittingActivityFeedSchema.parse(res.data.data);
}

export function useSittingActivityQuery(
  sittingDocumentId: string,
  options: { refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: [...SITTING_ACTIVITY_QUERY_KEY, sittingDocumentId],
    queryFn: () => fetchSittingActivity(sittingDocumentId),
    refetchInterval: options.refetchInterval ?? false,
  });
}
