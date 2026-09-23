'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { CLASSES_QUERY_KEY } from '@/modules/classes';
import { INVITATIONS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';

// C-INV-04: revoke an open invitation (invited/expired rows only). The API
// answers 409 on an accepted invitation — the caller deactivates the user
// instead — and maps any failure to a toast.
async function revokeInvitationRequest(documentId: string): Promise<void> {
  await strapi.delete(`/api/schools/me/invitations/${documentId}`);
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitationRequest,
    // BUG-006: a class waiting on this invitation changes state with it
    // (pending <-> reassign), so the classes list refreshes too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY }),
      ]),
  });
}
