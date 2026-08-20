'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { adminInvitationResultSchema } from '@/modules/ops/schemas/school-invitation.schema';

import type { InviteSchoolAdminInput } from '@/modules/ops/types/queries.types';
import type { AdminInvitationResult } from '@/modules/ops/types/school-invitation.types';

async function inviteSchoolAdmin({
  schoolDocumentId,
  contact_email,
  ...names
}: InviteSchoolAdminInput): Promise<AdminInvitationResult> {
  const res = await strapi.post<{ data: unknown }>(
    `/api/ops/schools/${schoolDocumentId}/admin-invitations`,
    { ...names, email: contact_email },
  );
  return adminInvitationResultSchema.parse(res.data.data);
}

export function useInviteSchoolAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteSchoolAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ops', 'invitations'] });
    },
  });
}
