'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  CONSENT_CONFIG_QUERY_KEY,
  STUDENT_CONSENTS_QUERY_KEY,
} from '@/modules/privacy-consent/constants/queries.constants';
import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import {
  consentRecordResponseSchema,
  consentWithdrawBodySchema,
} from '@/modules/privacy-consent/schemas/consent.schema';
import type {
  ConsentRecord,
  ConsentWithdrawInput,
} from '@/modules/privacy-consent/types/consent.types';

// POST /api/consents/:documentId/withdraw. Forward-looking only: data already
// processed is unaffected, and the confirmation says so.
async function withdrawConsentRequest({ documentId }: ConsentWithdrawInput): Promise<ConsentRecord> {
  const res = await strapi.post(
    `/api/consents/${encodeURIComponent(documentId)}/withdraw`,
    consentWithdrawBodySchema.parse({}),
  );
  return consentRecordResponseSchema.parse(res.data).data;
}

export function useWithdrawConsentMutation() {
  const queryClient = useQueryClient();
  const refreshRows = () => {
    void queryClient.invalidateQueries({ queryKey: STUDENT_CONSENTS_QUERY_KEY });
  };
  return useMutation({
    mutationFn: withdrawConsentRequest,
    onSuccess: refreshRows,
    onError: (error) => {
      const kind = classifyConsentError(error);
      // Already withdrawn elsewhere: re-read the ledger so the row tells the truth.
      if (kind === 'alreadyWithdrawn') {
        refreshRows();
      }
      if (kind === 'disabled') {
        void queryClient.invalidateQueries({ queryKey: CONSENT_CONFIG_QUERY_KEY });
      }
    },
  });
}
