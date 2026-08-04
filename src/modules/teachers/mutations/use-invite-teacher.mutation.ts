'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';
import { inviteTeacherResponseSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { InviteTeacherValues } from '@/modules/teachers/schemas/invite-teacher.schema';

// C-INV-01: create the invitation row and send the email. A 409 (an active
// user with that email already belongs to this school) is mapped inline by the
// dialog, so the hook only parses the success envelope.
async function inviteTeacherRequest(values: InviteTeacherValues) {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    '/api/schools/me/invitations',
    values,
  );
  return inviteTeacherResponseSchema.parse(res.data.data);
}

export function useInviteTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteTeacherRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}
