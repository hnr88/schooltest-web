'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { OPS_SITTING_MONITOR_QUERY_KEY } from '@/modules/ops/queries/use-ops-sitting-monitor.query';

import type { OpsResitInput } from '@/modules/ops/types/queries.types';

// C-OPS-02 re-sit passthrough (task 69): the ops-side twin of C-SIT-03 -
// terminates the student's in-flight session in this sitting so a fresh join
// starts clean. 404 non-roster student.
async function resitStudent(input: OpsResitInput): Promise<void> {
  await strapi.post(`/api/ops/sittings/${input.sittingDocumentId}/resit`, {
    student_documentId: input.studentDocumentId,
  });
}

export function useOpsResitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resitStudent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: OPS_SITTING_MONITOR_QUERY_KEY }),
  });
}
