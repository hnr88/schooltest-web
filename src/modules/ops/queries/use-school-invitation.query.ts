'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolInvitationSchema } from '@/modules/ops/schemas/school-invitation.schema';
import type { SchoolInvitation } from '@/modules/ops/types/school-invitation.types';

export const schoolInvitationQueryKey = (documentId: string) =>
  ['ops', 'school-invitation', documentId] as const;

// C-SCH-07: the ops-only invitation state behind the school detail page. The
// route carries global::is-ops plus the ops-only grant, so a wrong-role token
// answers 403 and no client-side filter is needed.
async function fetchSchoolInvitation(documentId: string): Promise<SchoolInvitation> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/schools/${documentId}/onboarding-invitation`,
  );
  return schoolInvitationSchema.parse(res.data.data);
}

export function useSchoolInvitationQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: schoolInvitationQueryKey(documentId),
    queryFn: () => fetchSchoolInvitation(documentId),
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
