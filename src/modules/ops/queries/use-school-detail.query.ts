'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  schoolDetailPath,
  schoolDetailResponseSchema,
  type SchoolDetail,
} from '@/modules/ops/lib/ops-school-detail-contract';

/**
 * C-OPS-PORTAL-002 — GET /api/ops/schools/{documentId} (OPS-012).
 *
 * Replaces the detail page's old data source, which fetched the ENTIRE school
 * directory and then did `rows.find(r => r.documentId === documentId)` in the
 * browser. That made a deep link cost every school in the tenant, and — once
 * the directory became paginated in OPS-011 — made any school outside page 1
 * render as "not found" even though it exists.
 *
 * The response is PARSED, not cast: a server that returns a shape the contract
 * never promised fails loudly here instead of rendering undefined cells.
 *
 * The query key is scoped to the single documentId, which is what fixes the
 * "school A route while a stale school B request resolves" case in the task's
 * edge list — React Query cannot deliver B's payload into A's key, and rapid
 * back/forward re-reads each id's own cache entry rather than a shared list.
 */
export function schoolDetailQueryKey(schoolDocumentId: string) {
  return ['ops', 'schools', schoolDocumentId, 'detail'] as const;
}

export async function fetchSchoolDetail(schoolDocumentId: string): Promise<SchoolDetail> {
  const res = await strapi.get<unknown>(schoolDetailPath(schoolDocumentId), {
    opsPortalVersioned: true,
  });
  return schoolDetailResponseSchema.parse(res.data).data;
}

export function useSchoolDetailQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: schoolDetailQueryKey(schoolDocumentId),
    queryFn: () => fetchSchoolDetail(schoolDocumentId),
    // A deleted school (404) and a denied read (403) are both terminal: retrying
    // cannot change either answer, and a retry loop would hide the real status
    // behind a spinner.
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
