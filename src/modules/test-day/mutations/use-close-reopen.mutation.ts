'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { CLASS_SITTINGS_QUERY_KEY } from '../queries/use-class-sittings.query';
import { SITTING_MONITOR_QUERY_KEY } from '../queries/use-sitting-monitor.query';

export interface CloseReopenInput {
  sittingDocumentId: string;
  action: 'close' | 'reopen';
}

// E2-11 close/reopen: a closed sitting blocks join (C-SIT-01 400) and disables
// reveal on the screen; reopen restores it.
async function closeReopenRequest(input: CloseReopenInput): Promise<void> {
  await strapi.post(`/api/sittings/${input.sittingDocumentId}/${input.action}`);
}

export function useCloseReopenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeReopenRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASS_SITTINGS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SITTING_MONITOR_QUERY_KEY });
    },
  });
}
