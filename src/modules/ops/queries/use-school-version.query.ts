'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolVersionSchema } from '@/modules/ops/schemas/school-suspend.schema';
import type { SchoolVersion } from '@/modules/ops/types/school-suspend.types';

export const schoolVersionQueryKey = (documentId: string) =>
  ['ops', 'school-version', documentId] as const;

/**
 * The per-resource version a lifecycle write must quote in `If-Match`
 * (contract-rules.md "Concurrent edits"). It comes from an AUTHORIZED read of
 * the school row itself — the ops role holds `read(api::school.school)` — never
 * from a client clock, and never from a collection ETag. Only the two fields
 * the write depends on are requested.
 */
export async function fetchSchoolVersion(documentId: string): Promise<SchoolVersion> {
  const res = await strapi.get<{ data: unknown }>(`/api/schools/${documentId}`, {
    params: { 'fields[0]': 'documentId', 'fields[1]': 'updatedAt' },
  });
  return schoolVersionSchema.parse(res.data.data);
}

export function useSchoolVersionQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: schoolVersionQueryKey(documentId),
    queryFn: () => fetchSchoolVersion(documentId),
    enabled,
    retry: false,
    // The version is the point of this query: a stale one must surface as the
    // server's 412, so it is never served from cache without a refetch.
    staleTime: 0,
  });
}
