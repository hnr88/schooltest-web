'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  classesListPath,
  classesListQueryParams,
  classesListResponseSchema,
  type ClassesListQuery,
  type ClassesListResponse,
} from '@/modules/ops/lib/ops-classes-contract';

/**
 * C-OPS-PORTAL-028 — GET /api/ops/schools/{documentId}/classes.
 *
 * The Classes tab used to build its rows out of the staff directory, so a
 * class with no teacher simply did not exist on screen and the student count /
 * test window columns rendered "Not served". This hook reads the real
 * operation: every class of the school, its live active-student count, the
 * school's test window, and server-side pagination.
 *
 * The response is PARSED, not cast: a server that starts returning a shape the
 * contract never promised fails here, loudly, instead of rendering undefined
 * cells. The request is sent with the portal version header, which selects the
 * wire shape and carries no authority of its own.
 */
export function classesListQueryKey(schoolDocumentId: string, query: ClassesListQuery) {
  return ['ops', 'schools', schoolDocumentId, 'classes', query] as const;
}

async function fetchClassesList(
  schoolDocumentId: string,
  query: ClassesListQuery,
): Promise<ClassesListResponse> {
  const res = await strapi.get<unknown>(classesListPath(schoolDocumentId), {
    params: classesListQueryParams(query),
    opsPortalVersioned: true,
  });
  return classesListResponseSchema.parse(res.data);
}

export function useClassesListQuery(
  schoolDocumentId: string,
  query: ClassesListQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: classesListQueryKey(schoolDocumentId, query),
    queryFn: () => fetchClassesList(schoolDocumentId, query),
    enabled,
    retry: false,
    // A page that is being paged through must not flash empty between pages.
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}
