import { useQuery } from '@tanstack/react-query';

import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';
import {
  schoolMembershipsResponseSchema,
  type SchoolMemberships,
} from '@/modules/school-admin/schemas/school-memberships.schema';

// Multi-tenant school switcher (C: memberships) — every school the signed-in
// school_admin administers. The server denies every non-school_admin role at
// the grant layer and the query is additionally `enabled` on the role, so the
// teacher/parent/ops portals never fetch it. The zod parse mirrors the server
// contract in schooltest-api/src/contracts/school-admin.ts — an unknown key is
// a contract defect and fails loudly.
async function fetchSchoolMemberships(): Promise<SchoolMemberships> {
  const res = await strapi.get<{ data: unknown }>('/api/schools/me/memberships');
  const parsed = schoolMembershipsResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error(`memberships contract violation: ${parsed.error.issues[0]?.path.join('.')} ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data.data;
}

export function useSchoolMembershipsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['school-admin', 'memberships'],
    queryFn: fetchSchoolMemberships,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
