'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { STUDENT_CONSENTS_QUERY_KEY } from '@/modules/privacy-consent/constants/queries.constants';
import { consentListResponseSchema } from '@/modules/privacy-consent/schemas/consent.schema';
import type { ConsentRecord } from '@/modules/privacy-consent/types/consent.types';

// GET /api/consents?student=<documentId>: every ledger row of one student the
// caller may see (a guardian's own child, a school admin's own student). A foreign
// or unknown student is the same 404 for both.
async function fetchStudentConsents(studentDocumentId: string): Promise<ConsentRecord[]> {
  const res = await strapi.get('/api/consents', { params: { student: studentDocumentId } });
  return consentListResponseSchema.parse(res.data).data;
}

export function useStudentConsentsQuery(studentDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...STUDENT_CONSENTS_QUERY_KEY, studentDocumentId],
    queryFn: () => fetchStudentConsents(studentDocumentId),
    enabled: enabled && Boolean(studentDocumentId),
    staleTime: 0,
    retry: false,
  });
}
