'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  mfaVerifyRequestSchema,
  mfaVerifyResponseSchema,
  type MfaVerifyInput,
} from '@/modules/auth/schemas/mfa.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { MfaVerifyResponse } from '@/modules/auth/types/mfa.types';

async function mfaVerifyRequest(input: MfaVerifyInput): Promise<MfaVerifyResponse> {
  // Validate on the client boundary too: the API's body is strict, exactly one
  // factor. The bearer is attached by the request interceptor (the MFA path is
  // not a public auth path), so no new header and no CORS change.
  const payload = mfaVerifyRequestSchema.parse(input);
  const res = await strapi.post<unknown>('/api/auth/mfa/verify', payload);
  return mfaVerifyResponseSchema.parse(res.data);
}

// Success returns the step-up JWT (same user, amr [pwd, otp]). It replaces the
// stored token through the store's setToken -> writeClientToken, which also
// clears the mfaRequired flag; every cached query is then invalidated so the
// guard's `me` read and the screen's own reads refetch under the new token.
// Errors write nothing.
export function useMfaVerifyMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: mfaVerifyRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      void queryClient.invalidateQueries();
    },
  });
}
