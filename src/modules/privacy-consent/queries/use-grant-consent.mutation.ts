'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  CONSENT_CONFIG_QUERY_KEY,
  STUDENT_CONSENTS_QUERY_KEY,
} from '@/modules/privacy-consent/constants/queries.constants';
import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import {
  consentGrantBodySchema,
  consentRecordResponseSchema,
} from '@/modules/privacy-consent/schemas/consent.schema';
import type { ConsentGrantBody, ConsentRecord } from '@/modules/privacy-consent/types/consent.types';

// POST /api/consents. The API sets the role and source from the caller (a guardian
// writes `parent_portal`, a school admin `school_attestation`) and is idempotent
// per student, type and policy version.
async function grantConsentRequest(body: ConsentGrantBody): Promise<ConsentRecord> {
  const res = await strapi.post('/api/consents', consentGrantBodySchema.parse(body));
  return consentRecordResponseSchema.parse(res.data).data;
}

export function useGrantConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: grantConsentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_CONSENTS_QUERY_KEY });
    },
    onError: (error) => {
      // The switch was turned off since the panel loaded: re-read it so the panel hides.
      if (classifyConsentError(error) === 'disabled') {
        void queryClient.invalidateQueries({ queryKey: CONSENT_CONFIG_QUERY_KEY });
      }
    },
  });
}
