'use client';

import { z } from 'zod';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

/**
 * GET /api/schools/{documentId}/entitlement — the ops read of ANOTHER school's
 * entitlement. Distinct from the school-admin `/schools/me/entitlement` read,
 * which is scoped to the caller's own school and takes no id.
 *
 * `seats_used` is computed server-side at read from the school's active
 * students, so the meter here is always live — it is never a stored counter
 * that can drift. A school with no entitlement row self-heals to the empty
 * shape (0 seats) rather than 404ing, which is what lets ops open this panel
 * on an imported school and give it seats for the first time.
 */
const allowanceSchema = z.object({
  test_type: z.string(),
  total: z.number(),
  used: z.number(),
  remaining: z.number(),
});

export const opsSchoolEntitlementSchema = z.object({
  plan: z.string(),
  plan_code: z.string().nullable(),
  seats_total: z.number(),
  seats_used: z.number(),
  seats_remaining: z.number(),
  allowances: z.array(allowanceSchema),
  renewal_date: z.string().nullable(),
  account_status: z.string(),
});

export type OpsSchoolEntitlement = z.infer<typeof opsSchoolEntitlementSchema>;

export const schoolEntitlementQueryKey = (schoolDocumentId: string) =>
  ['ops', 'schools', schoolDocumentId, 'entitlement'] as const;

async function fetchSchoolEntitlement(schoolDocumentId: string): Promise<OpsSchoolEntitlement> {
  const res = await strapi.get<{ data: unknown }>(`/api/schools/${schoolDocumentId}/entitlement`);
  return opsSchoolEntitlementSchema.parse(res.data.data);
}

export function useSchoolEntitlementQuery(schoolDocumentId: string, enabled: boolean) {
  return useQuery({
    queryKey: schoolEntitlementQueryKey(schoolDocumentId),
    queryFn: () => fetchSchoolEntitlement(schoolDocumentId),
    enabled,
  });
}
