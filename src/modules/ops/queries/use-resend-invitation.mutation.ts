'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolInvitationQueryKey } from '@/modules/ops/queries/use-school-invitation.query';
import { onboardingLinkResultSchema } from '@/modules/ops/schemas/school-invitation.schema';
import type { OnboardingLinkResult } from '@/modules/ops/types/school-invitation.types';

// C-SCH-05 — resend. The recipient comes from the stored contact server-side;
// the body is empty by contract, so nothing here can redirect the email.
async function resendInvitation(schoolDocumentId: string): Promise<OnboardingLinkResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/schools/${schoolDocumentId}/onboarding-link/resend`,
    {},
  );
  return onboardingLinkResultSchema.parse(res.data.data);
}

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: async (_data, schoolDocumentId) => {
      await queryClient.invalidateQueries({ queryKey: schoolInvitationQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
