'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  mfaStatusResponseSchema,
  type MfaStatusResponse,
} from '@/modules/auth/schemas/mfa.schema';

export const MFA_STATUS_QUERY_KEY = ['auth', 'mfa', 'status'] as const;

async function fetchMfaStatus(): Promise<MfaStatusResponse> {
  // The bare contract object (no `{ data }` envelope); the bearer is attached
  // by the request interceptor.
  const res = await strapi.get<unknown>('/api/auth/mfa/status');
  return mfaStatusResponseSchema.parse(res.data);
}

// W3-22: the ONE read that decides whether the enrolment panel exists. It never
// retries and never refetches on focus: a role the API does not offer MFA to
// answers `available: false` once and the panel stays absent. A failed read is
// treated as "not available" by the caller (no panel, no further request).
export function useMfaStatusQuery() {
  return useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: fetchMfaStatus,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}
