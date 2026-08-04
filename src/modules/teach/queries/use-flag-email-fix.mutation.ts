'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASS_ROSTER_QUERY_KEY } from '@/modules/teach/constants/queries.constants';
import { flagEmailFixResponseSchema } from '@/modules/teach/schemas/roster.schema';

// C-CHD-05 (task 102, mvp-updates §4.4): the teacher flags a wrong or missing
// email for the school administrator to fix before it fails at login on test
// day. C-CHD-01 projects email_fix_requested since task 103, and the roster
// schema parses it since task 106 (the D-18 gap closed), so the pending badge
// is server-driven; the session-side set only bridges the moment between the
// mutation response and the invalidated roster refetch. Re-flagging an
// already-flagged row is a UI no-op.
async function flagEmailFixRequest(documentId: string) {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    `/api/schools/me/children/${documentId}/flag-email-fix`,
  );
  return flagEmailFixResponseSchema.parse(res.data.data);
}

export function useFlagEmailFixMutation() {
  const t = useTranslations('Teach.roster');
  const queryClient = useQueryClient();
  const [flaggedIds, setFlaggedIds] = useState<ReadonlySet<string>>(() => new Set());

  const mutation = useMutation({
    mutationFn: flagEmailFixRequest,
    onSuccess: (data) => {
      setFlaggedIds((current) => new Set(current).add(data.documentId));
      void queryClient.invalidateQueries({ queryKey: CLASS_ROSTER_QUERY_KEY });
      toast.success(t('emailFixSuccessToast'));
    },
    onError: () => {
      toast.error(t('emailFixErrorToast'));
    },
  });

  return {
    flagEmailFix: (documentId: string) => {
      if (flaggedIds.has(documentId) || mutation.isPending) {
        return;
      }
      mutation.mutate(documentId);
    },
    isFlagged: (documentId: string) => flaggedIds.has(documentId),
    pendingDocumentId: mutation.isPending ? mutation.variables : undefined,
  };
}
