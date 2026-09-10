'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { strapi } from '@/lib/axios/strapi';
import type { SittingActivityAppend } from '@/modules/teacher/schemas/teacher-session.schema';
import { SITTING_ACTIVITY_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';

// C-SIT-ACTIVITY-ADD (teacher task 13) — the ONE entry a teacher can type
// (Log an incident). The actor is the JWT caller server-side and is never
// sent; the appended entry appears in the panel on the invalidated refetch.
async function logIncidentRequest(input: SittingActivityAppend & { sittingDocumentId: string }) {
  const res = await strapi.post(`/api/sittings/${input.sittingDocumentId}/activity`, {
    note: input.note,
    kind: input.kind,
  });
  return res.data;
}

export function useLogIncidentMutation(sittingDocumentId: string) {
  const t = useTranslations('TestDay.activity');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logIncidentRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...SITTING_ACTIVITY_QUERY_KEY, sittingDocumentId],
      });
      toast.success(t('incidentLogged'));
    },
  });
}
