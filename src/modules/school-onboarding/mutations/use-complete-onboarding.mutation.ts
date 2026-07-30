'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { completeOnboardingResponseSchema } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type {
  CompleteOnboardingResult,
  ProvenanceMap,
  SchoolOnboardingPayload,
  TeacherEntry,
} from '@/modules/school-onboarding/types/school-onboarding.types';

export interface CompleteOnboardingInput {
  token: string;
  payload: SchoolOnboardingPayload;
  provenance: ProvenanceMap;
  admin: { first_name: string; last_name: string; email: string; password: string };
  teachers: TeacherEntry[];
}

// C-ONB-03: error mapping (400 server message, 409 used screen) lives in the
// caller — the hook only parses the success envelope.
async function completeOnboardingRequest(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    `/api/school-onboarding/${input.token}/complete`,
    {
      payload: input.payload,
      provenance: input.provenance,
      admin: input.admin,
      teachers: input.teachers,
    },
  );
  return completeOnboardingResponseSchema.parse(res.data.data);
}

export function useCompleteOnboardingMutation() {
  return useMutation({ mutationFn: completeOnboardingRequest });
}
