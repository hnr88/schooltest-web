'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { SITTING_MONITOR_QUERY_KEY } from '@/modules/test-day/queries/use-sitting-monitor.query';

import type { ResitInput } from '@/modules/test-day/types/queries.types';

// C-SIT-03: terminates the student's in-flight session in this sitting so
// they can join again fresh (absent earlier, crashed laptop, and the like).
async function resitRequest(input: ResitInput): Promise<void> {
  await strapi.post(`/api/sittings/${input.sittingDocumentId}/resit`, {
    student_documentId: input.studentDocumentId,
  });
}

export function useResitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resitRequest,
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({
        queryKey: [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId],
      }),
  });
}
