'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type {
  Entitlement,
  EntitlementResponse,
} from '@/modules/school-admin/types/school-admin.types';

// C-ENT-01: seats_used and allowance remaining are computed at read, so a
// short staleTime keeps the overview honest after adding children or tests.
async function fetchEntitlement(): Promise<Entitlement> {
  const res = await strapi.get<EntitlementResponse>('/api/schools/me/entitlement');
  return res.data.data;
}

export function useEntitlementQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['school-admin', 'entitlement'],
    queryFn: fetchEntitlement,
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
