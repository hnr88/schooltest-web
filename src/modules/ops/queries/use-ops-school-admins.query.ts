'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  opsSchoolAdminSchema,
  type OpsSchoolAdmin,
} from '@/modules/ops/schemas/ops-school-admin.schema';

// Ops school-admins directory (task 024, Admins tab): the cross-school ops
// users surface, school-scoped and role-filtered. /api/ops/users responds with
// a `data` array; the rows carry no last-login field, so the "last seen" column
// is not served and is omitted (task 020 ruling).
export function opsSchoolAdminsQueryKey(schoolDocumentId: string) {
  return ['ops', 'schools', schoolDocumentId, 'admins'] as const;
}

async function fetchOpsSchoolAdmins(schoolDocumentId: string): Promise<OpsSchoolAdmin[]> {
  const res = await strapi.get<{ data: unknown } | unknown[]>(
    `/api/ops/users?school=${schoolDocumentId}&role=school_admin`,
  );
  const rows = Array.isArray(res.data) ? res.data : (res.data as { data: unknown[] }).data;
  return (rows as unknown[]).map((row) => opsSchoolAdminSchema.parse(row));
}

export function useOpsSchoolAdminsQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: opsSchoolAdminsQueryKey(schoolDocumentId),
    queryFn: () => fetchOpsSchoolAdmins(schoolDocumentId),
    enabled: enabled && Boolean(schoolDocumentId),
    staleTime: 60 * 1000,
    retry: false,
  });
}
