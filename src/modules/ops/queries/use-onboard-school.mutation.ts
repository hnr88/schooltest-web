'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolInvitationQueryKey } from '@/modules/ops/queries/use-school-invitation.query';
import {
  onboardingLinkResultSchema,
  type OnboardSchoolValues,
} from '@/modules/ops/schemas/school-invitation.schema';
import type { OnboardingLinkResult } from '@/modules/ops/types/school-invitation.types';

import type { OnboardSchoolInput } from '@/modules/ops/types/queries.types';

// C-SCH-04 (v2) — the spec's "Onboard School" action. A 409 (the school already
// holds an active invitation) is surfaced inline by the dialog, so the hook only
// parses the success envelope.
async function onboardSchool({
  schoolDocumentId,
  ...body
}: OnboardSchoolInput): Promise<OnboardingLinkResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/schools/${schoolDocumentId}/onboarding-link`,
    body,
  );
  return onboardingLinkResultSchema.parse(res.data.data);
}

export function useOnboardSchoolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onboardSchool,
    onSuccess: async (_data, input) => {
      // Both the detail badges and the schools list read the same lifecycle
      // columns, so both caches are refreshed from the server.
      await queryClient.invalidateQueries({
        queryKey: schoolInvitationQueryKey(input.schoolDocumentId),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
