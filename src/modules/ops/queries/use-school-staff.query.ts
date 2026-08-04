'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  schoolStaffUserSchema,
  type SchoolStaffUser,
} from '@/modules/ops/schemas/surfaces.schema';
import { SCHOOL_STAFF_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// View-as-teacher picker source (task 70): the school's staff users from the
// C-OPS-01 detail relations — the EXISTING core GET /api/schools/:documentId
// with the users relation populated (ops holds read on school + user). The
// role relation is restricted over REST, so the API stays the teacher-only
// enforcer (404 on a non-teacher pick).
async function fetchSchoolStaff(schoolDocumentId: string): Promise<SchoolStaffUser[]> {
  const res = await strapi.get<{ data: { users?: unknown } }>(
    `/api/schools/${schoolDocumentId}`,
    {
      params: {
        'fields[0]': 'name',
        'populate[users][fields][0]': 'first_name',
        'populate[users][fields][1]': 'last_name',
        'populate[users][fields][2]': 'email',
        'pagination[pageSize]': 100,
      },
    },
  );
  const users = Array.isArray(res.data.data.users) ? res.data.data.users : [];
  return users.map((row) => schoolStaffUserSchema.parse(row));
}

export function useSchoolStaffQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...SCHOOL_STAFF_QUERY_KEY, schoolDocumentId],
    queryFn: () => fetchSchoolStaff(schoolDocumentId),
    enabled: enabled && schoolDocumentId !== '',
    retry: false,
    staleTime: 60 * 1000,
  });
}
