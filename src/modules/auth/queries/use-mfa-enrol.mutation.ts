'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { MFA_STATUS_QUERY_KEY } from '@/modules/auth/queries/use-mfa-status.query';
import {
  mfaEnrolConfirmRequestSchema,
  mfaEnrolConfirmResponseSchema,
  mfaEnrolStartRequestSchema,
  mfaEnrolStartResponseSchema,
  type MfaEnrolConfirmInput,
  type MfaEnrolConfirmResponse,
  type MfaEnrolStartInput,
  type MfaEnrolStartResponse,
} from '@/modules/auth/schemas/mfa.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

async function enrolStartRequest(input: MfaEnrolStartInput): Promise<MfaEnrolStartResponse> {
  // Strict on the client boundary too: empty body asks for the emailed code,
  // `{ emailCode }` redeems it (or, for an already-enrolled account holding a
  // step-up proof, the API answers with a fresh secret straight away).
  const payload = mfaEnrolStartRequestSchema.parse(input);
  const res = await strapi.post<unknown>('/api/auth/mfa/enrol/start', payload);
  return mfaEnrolStartResponseSchema.parse(res.data);
}

async function enrolConfirmRequest(input: MfaEnrolConfirmInput): Promise<MfaEnrolConfirmResponse> {
  const payload = mfaEnrolConfirmRequestSchema.parse(input);
  const res = await strapi.post<unknown>('/api/auth/mfa/enrol/confirm', payload);
  return mfaEnrolConfirmResponseSchema.parse(res.data);
}

// gcTime 0: the success body carries the one-time secret / recovery codes, so
// a finished mutation must not linger in the mutation cache. The caller copies
// what it needs into component state and calls reset().
export function useMfaEnrolStartMutation() {
  return useMutation({ mutationFn: enrolStartRequest, gcTime: 0 });
}

// Success returns the step-up JWT (same user, amr [pwd, otp]) beside the eight
// recovery codes. The jwt replaces the stored token through the store's
// setToken (the same path as the W3-20 verify); only the MFA status is
// refetched, awaited, so the panel's enrolled view is fresh once the codes are
// acknowledged. The old token is still valid, so nothing else needs a refetch.
export function useMfaEnrolConfirmMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: enrolConfirmRequest,
    gcTime: 0,
    onSuccess: async (data) => {
      setToken(data.jwt);
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
    },
  });
}
