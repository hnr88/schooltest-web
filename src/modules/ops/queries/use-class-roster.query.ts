'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  rosterListPath,
  rosterListResponseSchema,
  type RosterListQuery,
  type RosterListResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-PORTAL-037 (row 20) — the ops class-roster read.
//
// Path AND query string come from the shared contract's own encoder
// (`rosterListPath`), so the client cannot invent a second spelling of a
// filter, and the 200 body is parsed through the shared schema: a drifted
// projection throws here instead of rendering as a silently empty roster.
//
// THIS IS THE STUDENTS-TAB READ WITH THE CLASS PINNED BY THE PATH. The row is
// literally `opsStudentRowSchema`, the same row `use-students-list.query.ts`
// parses — the two response schemas emit byte-identical JSON Schema — so the
// roster table and the students table cannot drift. Only the `class` filter is
// absent, because the path already fixes one class of the school.
//
// The class detail read deliberately carries NO student array (its own contract
// says so); this hook is where the roster comes from.
export function classRosterQueryKey(
  schoolDocumentId: string,
  classDocumentId: string,
  query: RosterListQuery,
) {
  return ['ops', 'schools', schoolDocumentId, 'classes', classDocumentId, 'students', query] as const;
}

async function fetchClassRoster(
  schoolDocumentId: string,
  classDocumentId: string,
  query: RosterListQuery,
): Promise<RosterListResponse> {
  const res = await strapi.get<unknown>(rosterListPath(schoolDocumentId, classDocumentId, query), {
    opsPortalVersioned: true,
  });
  return rosterListResponseSchema.parse(res.data);
}

/**
 * Server-side filtering and paging: every filter or page change refetches
 * rather than slicing a cached page, so `meta.pagination.total` always
 * describes the whole filtered roster and never just the rows on screen.
 * `keepPreviousData` holds the current rows while the next page loads instead
 * of flashing the empty state — which matters here because the empty state is
 * a real, designed screen (`Ops Portal.dc.html:522-525`) and must mean "this
 * class has no students", never "a page is in flight".
 */
export function useClassRosterQuery(
  schoolDocumentId: string,
  classDocumentId: string,
  query: RosterListQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: classRosterQueryKey(schoolDocumentId, classDocumentId, query),
    queryFn: () => fetchClassRoster(schoolDocumentId, classDocumentId, query),
    enabled: enabled && Boolean(schoolDocumentId) && Boolean(classDocumentId),
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
