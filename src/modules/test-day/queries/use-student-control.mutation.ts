'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  SITTING_ACTIVITY_QUERY_KEY,
  SITTING_MONITOR_QUERY_KEY,
  SITTING_SUMMARY_QUERY_KEY,
} from '@/modules/test-day/constants/queries.constants';
import {
  sittingStudentControlStateSchema,
  studentControlRequestSchema,
  type SittingStudentControlState,
  type StudentControlRequest,
} from '@/modules/test-day/schemas/test-day.schema';

// Teacher Portal v2 B2 per-student controls:
// POST /api/sittings/:documentId/students/:studentDocumentId/pause | /resume |
// /extend {minutes} | /submit | /relaunch -> 200 { data }. A 409 carries
// details.reason (not_running | no_active_attempt | already_paused |
// not_paused) and details.phase; a student off the roster is a 404.
async function studentControlRequest(
  input: StudentControlRequest,
): Promise<SittingStudentControlState> {
  const request = studentControlRequestSchema.parse(input);
  const body = request.action === 'extend' ? { minutes: request.minutes } : {};
  const res = await strapi.post<{ data: unknown }>(
    `/api/sittings/${request.sittingDocumentId}/students/${request.studentDocumentId}/${request.action}`,
    body,
  );
  return sittingStudentControlStateSchema.parse(res.data.data);
}

export function useStudentControlMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentControlRequest,
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({
        queryKey: [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...SITTING_ACTIVITY_QUERY_KEY, input.sittingDocumentId],
      });
      void queryClient.invalidateQueries({ queryKey: [...SITTING_SUMMARY_QUERY_KEY] });
    },
  });
}
