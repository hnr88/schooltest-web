'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';
import { inviteTeacherResponseSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { InviteTeacherInput } from '@/modules/teachers/types/teachers.types';

// C-INV-01: create the invitation row and send the email. The endpoint requires
// a role and rejects an unknown one, so the caller's role is joined to the
// three form fields HERE rather than being asked of the admin. A 409 (an active
// user with that email already belongs to this school) is mapped inline by the
// dialog, so the hook only parses the success envelope.
async function inviteTeacherRequest({ values, role }: InviteTeacherInput) {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/schools/me/invitations', {
    ...values,
    role,
  });
  return inviteTeacherResponseSchema.parse(res.data.data);
}

export function useInviteTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteTeacherRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}
