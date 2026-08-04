'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { saveProgressResponseSchema } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type {
  ProvenanceMap,
  SaveProgressResult,
  SchoolOnboardingPayload,
} from '@/modules/school-onboarding/types/school-onboarding.types';

import type { SaveProgressInput } from '@/modules/school-onboarding/types/queries.types';

// C-ONB-02: mirror of the localStorage progress to the API after each step.
async function saveProgressRequest(input: SaveProgressInput): Promise<SaveProgressResult> {
  const res = await strapi.put<StrapiSingleResponse<unknown>>(
    `/api/school-onboarding/${input.token}/progress`,
    {
      current_step: input.current_step,
      payload: input.payload,
      provenance: input.provenance,
    },
  );
  return saveProgressResponseSchema.parse(res.data.data);
}

export function useSaveProgressMutation() {
  const t = useTranslations('SchoolOnboarding.errors');

  return useMutation({
    mutationFn: saveProgressRequest,
    // Failure is non-blocking: the local copy in the wizard store is the
    // source of truth until the next successful save.
    onError: () => {
      toast.error(t('saveFailed'));
    },
  });
}
