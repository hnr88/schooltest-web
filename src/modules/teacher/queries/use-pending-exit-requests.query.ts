'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { PENDING_EXIT_REQUESTS_POLL_INTERVAL_MS } from '@/modules/teacher/constants/exit-requests.constants';
import { pendingExitRequestsResponseSchema } from '@/modules/teacher/schemas/exit-request.schema';
import type { PendingExitRequest } from '@/modules/teacher/schemas/exit-request.schema';

// SEMANTIC contract: GET the pending exit requests for the teacher's
// supervised sittings, filtered to ONE sitting — the one the Live tab is
// showing. Answers a BARE array; Zod-parsed so a shape the contract does not
// describe throws HERE.
async function fetchPendingExitRequests(sittingDocumentId: string): Promise<PendingExitRequest[]> {
  const response = await strapi.get(`/api/exit-requests/pending`, {
    params: { sitting: sittingDocumentId },
  });
  return pendingExitRequestsResponseSchema.parse(response.data);
}

/**
 * The ONE key + fetcher for this read. Scoped per sitting so a panel mounted
 * for another sitting never shares (or invalidates into) this cache slot.
 */
export function pendingExitRequestsQueryOptions(sittingDocumentId: string) {
  return queryOptions({
    queryKey: ['teacher', 'exit-requests', 'pending', sittingDocumentId],
    queryFn: () => fetchPendingExitRequests(sittingDocumentId),
    staleTime: 0,
    retry: false,
  });
}

/**
 * The live tab's pending-exit-requests queue. Polls every
 * `PENDING_EXIT_REQUESTS_POLL_INTERVAL_MS` while mounted — a student locked in
 * a test is waiting on this answer — and refetches on window focus, since the
 * teacher may come back to the tab exactly to answer these.
 */
export function usePendingExitRequestsQuery(sittingDocumentId: string) {
  return useQuery({
    ...pendingExitRequestsQueryOptions(sittingDocumentId),
    enabled: Boolean(sittingDocumentId),
    refetchInterval: PENDING_EXIT_REQUESTS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
