'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import {
  recoverySittingSchema,
  type RecoverySitting,
} from '@/modules/ops/schemas/recovery.schema';

export const SCHOOL_SITTINGS_QUERY_KEY = ['ops', 'school-sittings'] as const;

/** The picker never needs more than the school's recent sittings. */
const SITTING_LIMIT = 50;

// C-OPS-02 (task 69): the sitting picker reads the EXISTING core
// GET /api/sittings (ops holds full visibility) filtered to the school's
// classes - no new GET. Newest first.
async function fetchSchoolSittings(schoolDocumentId: string): Promise<RecoverySitting[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/sittings', {
    params: {
      'filters[class][school][documentId][$eq]': schoolDocumentId,
      'populate[class][fields][0]': 'name',
      'fields[0]': 'code',
      'fields[1]': 'status',
      'fields[2]': 'skill',
      'fields[3]': 'createdAt',
      sort: 'createdAt:desc',
      'pagination[pageSize]': SITTING_LIMIT,
    },
  });
  return res.data.data.map((row) => recoverySittingSchema.parse(row));
}

export function useSchoolSittingsQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...SCHOOL_SITTINGS_QUERY_KEY, schoolDocumentId],
    queryFn: () => fetchSchoolSittings(schoolDocumentId),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
