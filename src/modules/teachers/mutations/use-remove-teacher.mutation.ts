'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/queries/use-invitations.query';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers/queries/use-teachers.query';
import { removeTeacherResponseSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { RemoveTeacherResult } from '@/modules/teachers/types/teachers.types';

// C-TCH-03: permanently remove a staff account from the school. The API blocks
// the account, severs the school link, drops its class links and revokes any
// open invitation for that address, so both the staff list and the invitation
// list are invalidated. The response is parsed, never assumed — and there is no
// optimistic update: the row disappears because the server said so.
async function removeTeacherRequest(documentId: string): Promise<RemoveTeacherResult> {
  const { data } = await strapi.delete(`/api/schools/me/teachers/${documentId}`);
  return removeTeacherResponseSchema.parse(data.data);
}

export function useRemoveTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTeacherRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
      ]);
    },
  });
}
