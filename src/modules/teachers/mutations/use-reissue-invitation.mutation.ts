'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/queries/use-invitations.query';
import { reissueInvitationResponseSchema } from '@/modules/teachers/schemas/teachers.schema';

// C-INV-03: new token + expiry, email resent. 409 on an accepted invitation is
// mapped to a toast by the caller.
async function reissueInvitationRequest(documentId: string) {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    `/api/schools/me/invitations/${documentId}/reissue`,
  );
  return reissueInvitationResponseSchema.parse(res.data.data);
}

export function useReissueInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reissueInvitationRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}
