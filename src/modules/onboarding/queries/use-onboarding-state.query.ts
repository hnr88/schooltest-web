'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';

import { onboardingStateSchema, type OnboardingState } from '@/modules/onboarding';

async function fetchOnboardingState(): Promise<OnboardingState> {
  const res = await strapi.get<StrapiSingleResponse<OnboardingState>>(
    '/api/users/me/onboarding'
  );
  return onboardingStateSchema.parse(res.data.data);
}

export function useOnboardingStateQuery(
  options?: Omit<UseQueryOptions<OnboardingState>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['onboarding', 'me'],
    queryFn: fetchOnboardingState,
    ...options,
  });
}
