'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { strapi } from '@/lib/axios/strapi';
import { SITTING_MONITOR_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';
import type { MonitorStudent, SittingMonitor } from '@/modules/test-day/types/test-day.types';

import type { MarkAbsentInput } from '@/modules/test-day/types/queries.types';

// C-SIT-06 (task 120, mvp-updates §4.5.6): toggle a roster student's absent
// flag on the sitting - "a student who was away sits later".
async function markAbsentRequest(input: MarkAbsentInput): Promise<void> {
  await strapi.post(`/api/sittings/${input.sittingDocumentId}/absent`, {
    student_documentId: input.studentDocumentId,
    absent: input.absent,
  });
}

function withAbsent(
  student: MonitorStudent,
  studentDocumentId: string,
  absent: boolean,
): MonitorStudent {
  if (student.documentId !== studentDocumentId) return student;
  return {
    ...student,
    absent,
    // Mirror the server derivation (task 119) so the optimistic cache stays
    // self-consistent until the invalidated refetch lands.
    needs_to_sit: !absent && (student.state === 'not_joined' || student.state === 'stalled'),
  };
}

export function useMarkAbsentMutation() {
  const t = useTranslations('TestDay.monitor');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAbsentRequest,
    onMutate: async (input) => {
      const queryKey = [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SittingMonitor>(queryKey);
      if (previous) {
        queryClient.setQueryData<SittingMonitor>(queryKey, {
          ...previous,
          students: previous.students.map((student) =>
            withAbsent(student, input.studentDocumentId, input.absent),
          ),
        });
      }
      return { previous };
    },
    onError: (_error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId],
          context.previous,
        );
      }
      toast.error(t('absentErrorToast'));
    },
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId],
      }),
  });
}
