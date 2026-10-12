'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  CONSENT_CONFIG_QUERY_KEY,
  CONSENT_CONFIG_STALE_TIME_MS,
} from '@/modules/privacy-consent/constants/queries.constants';
import { consentConfigResponseSchema } from '@/modules/privacy-consent/schemas/consent.schema';
import type { ConsentConfig } from '@/modules/privacy-consent/types/consent.types';

// GET /api/consents/config answers every signed-in role: the effective privacy
// switches, the live policy version and the statement wording. The switches are
// read here and never from NEXT_PUBLIC env (D5).
async function fetchConsentConfig(): Promise<ConsentConfig> {
  const res = await strapi.get('/api/consents/config');
  return consentConfigResponseSchema.parse(res.data).data;
}

export function useConsentConfigQuery() {
  return useQuery({
    queryKey: CONSENT_CONFIG_QUERY_KEY,
    queryFn: fetchConsentConfig,
    staleTime: CONSENT_CONFIG_STALE_TIME_MS,
    retry: false,
  });
}
