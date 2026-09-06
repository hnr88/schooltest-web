'use client';

import { z } from 'zod';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolInvitationQueryKey } from '@/modules/ops/queries/use-school-invitation.query';
import { revokeInvitationResultSchema } from '@/modules/ops/schemas/school-invitation.schema';
import type { RevokeInvitationResult } from '@/modules/ops/types/school-invitation.types';

// C-SCH-06 — revoke. Invalidates every active magic link of the school and
// resets both lifecycle statuses; the stored contact is kept so ops can
// re-invite with different details.
async function revokeInvitation(schoolDocumentId: string): Promise<RevokeInvitationResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/schools/${schoolDocumentId}/onboarding-link/revoke`,
    {},
  );
  return revokeInvitationResultSchema.parse(res.data.data);
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: async (_data, schoolDocumentId) => {
      await queryClient.invalidateQueries({ queryKey: schoolInvitationQueryKey(schoolDocumentId) });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}

/* --- task 15: the STAFF invitation lifecycle (ops) ----------------------- */

/**
 * C-OPSI-02 — POST /api/ops/invitations/:documentId/revoke. Offered on
 * INVITATION ROWS only: an accepted invitation is refused by the server
 * (remove the account instead - task 16), and a revoked row stays revoked.
 */
export async function revokeStaffInvitation(
  invitationDocumentId: string,
): Promise<{ documentId: string; status: string }> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/invitations/${invitationDocumentId}/revoke`,
    {},
  );
  return z.strictObject({ documentId: z.string(), status: z.string() }).parse(res.data.data);
}

export function useStaffRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeStaffInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'invitations'] });
    },
  });
}
