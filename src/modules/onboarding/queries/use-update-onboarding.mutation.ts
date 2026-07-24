'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { onboardingStateSchema } from '@/modules/onboarding/schemas/onboarding.schema';
import type {
  OnboardingState,
  OnboardingUpdateInput,
} from '@/modules/onboarding/types/onboarding.types';

async function updateOnboardingRequest(input: OnboardingUpdateInput): Promise<OnboardingState> {
  const res = await strapi.post<StrapiSingleResponse<OnboardingState>>(
    '/api/users/me/onboarding',
    input,
  );
  return onboardingStateSchema.parse(res.data.data);
}

export function useUpdateOnboardingMutation() {
  const t = useTranslations('Onboarding');
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateOnboardingRequest,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['onboarding', 'me'] });
      toast.success(t(data.status === 'completed' ? 'completed' : 'skipped'));
    },
  });
}
