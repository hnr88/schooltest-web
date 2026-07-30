'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { acceptInvitationResponseSchema } from '@/modules/invitation/schemas/invite-accept.schema';
import type { AcceptInvitationResult } from '@/modules/invitation/types/invitation.types';

export interface AcceptInvitationInput {
  token: string;
  password: string;
  first_name: string;
  last_name: string;
}

// C-INV-06: error mapping (400 server message, 404/410/409 link states) lives
// in the caller — the hook only parses the success envelope.
async function acceptInvitationRequest(
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    `/api/invitations/${input.token}/accept`,
    {
      password: input.password,
      first_name: input.first_name,
      last_name: input.last_name,
    },
  );
  return acceptInvitationResponseSchema.parse(res.data.data);
}

export function useAcceptInvitationMutation() {
  return useMutation({ mutationFn: acceptInvitationRequest });
}
