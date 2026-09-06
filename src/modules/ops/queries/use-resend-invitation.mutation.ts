'use client';

import { z } from 'zod';

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

/* --- task 15: the STAFF invitation lifecycle (ops) ----------------------- */

/**
 * C-OPSI-03 — POST /api/ops/invitations/:documentId/resend. The server rotates
 * the token in place (invalidating the previous link), re-arms the 14-day
 * expiry and never returns the new token; a persisted cooldown answers 429
 * with Retry-After, which the axios boundary surfaces WITHOUT retrying.
 */
export async function resendStaffInvitation(
  invitationDocumentId: string,
): Promise<{ documentId: string; expires_at: string }> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/invitations/${invitationDocumentId}/resend`,
    {},
  );
  return z
    .strictObject({ documentId: z.string(), expires_at: z.string() })
    .parse(res.data.data);
}

export function useStaffResendInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendStaffInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'invitations'] });
    },
  });
}
