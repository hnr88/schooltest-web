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
      // Seed the cache with the server's own response FIRST so the done panel
      // renders even when the invalidated refetch fails (429/network) — a
      // refetch-dependent success state stranded parents on the finish step
      // with a success toast and no way forward.
      qc.setQueryData(['onboarding', 'me'], data);
      qc.invalidateQueries({ queryKey: ['onboarding', 'me'] });
      toast.success(t(data.status === 'completed' ? 'completed' : 'skipped'));
    },
    onError: () => {
      // Without this, a failed POST (429/500) was a dead button: no toast, no
      // state change, the parent clicking "Get started" with zero feedback.
      toast.error(t('updateError'));
    },
  });
}
