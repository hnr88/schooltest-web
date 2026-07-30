'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { schoolOnboardingResponseSchema } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { SchoolOnboardingData } from '@/modules/school-onboarding/types/school-onboarding.types';

// C-ONB-01: public endpoint. The axios client never attaches the stored JWT to
// /api/school-onboarding paths (see PUBLIC_ONBOARDING_PATH in strapi.ts), so a
// guest with a stale token in localStorage still gets the public 404/410/409.
async function fetchSchoolOnboarding(token: string): Promise<SchoolOnboardingData> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>(
    `/api/school-onboarding/${token}`,
  );
  return schoolOnboardingResponseSchema.parse(res.data.data);
}

export function useSchoolOnboardingQuery(token: string) {
  return useQuery({
    queryKey: ['school-onboarding', token],
    queryFn: () => fetchSchoolOnboarding(token),
    // A 404/410/409 is a terminal link state, never worth retrying.
    retry: false,
    staleTime: Infinity,
  });
}
