'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { invitationDetailsSchema } from '@/modules/invitation/schemas/invite-accept.schema';
import type { InvitationDetails } from '@/modules/invitation/types/invitation.types';

// C-INV-05: public endpoint. The axios client never attaches the stored JWT to
// /api/invitations paths (see PUBLIC_INVITATION_PATH in strapi.ts), so a guest
// with a stale token in localStorage still gets the public 404/410/409.
async function fetchInvitation(token: string): Promise<InvitationDetails> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>(`/api/invitations/${token}`);
  return invitationDetailsSchema.parse(res.data.data);
}

export function useInvitationQuery(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => fetchInvitation(token),
    // A 404/410/409 is a terminal link state, never worth retrying.
    retry: false,
    staleTime: Infinity,
  });
}
