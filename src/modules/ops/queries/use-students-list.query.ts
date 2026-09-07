'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  opsStudentsListPath,
  opsStudentsListResponseSchema,
  type OpsStudentsListQuery,
  type OpsStudentsListResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-PORTAL-035 (OPS-045) — the ops Students tab read.
//
// Path AND query string come from the shared contract's own encoder, so the
// client cannot invent a second spelling of a filter, and the 200 body is
// parsed through the shared schema: a drifted shape throws here instead of
// rendering as a silently empty roster. The request opts into the versioned
// portal contract (D-COMPAT) — the header selects a wire shape, never access.
export function opsStudentsListQueryKey(
  schoolDocumentId: string,
  query: OpsStudentsListQuery,
) {
  return ['ops', 'schools', schoolDocumentId, 'students', query] as const;
}

async function fetchOpsStudents(
  schoolDocumentId: string,
  query: OpsStudentsListQuery,
): Promise<OpsStudentsListResponse> {
  const res = await strapi.get<unknown>(opsStudentsListPath(schoolDocumentId, query), {
    opsPortalVersioned: true,
  });
  return opsStudentsListResponseSchema.parse(res.data);
}

/**
 * Server-side filtering and paging: every filter change refetches rather than
 * slicing a cached page, so `meta.pagination.total` always describes the whole
 * filtered scope. `keepPreviousData` holds the current rows on screen while the
 * next page loads instead of flashing the empty state.
 */
export function useStudentsListQuery(
  schoolDocumentId: string,
  query: OpsStudentsListQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: opsStudentsListQueryKey(schoolDocumentId, query),
    queryFn: () => fetchOpsStudents(schoolDocumentId, query),
    enabled,
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
