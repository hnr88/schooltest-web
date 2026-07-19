'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/modules/auth/schemas/forgot-password.schema';
import type { ResendConfirmationResponse } from '@/modules/auth/types/auth.types';

// C-AUTH-SEND-CONFIRM shares the forgot-password boundary shape ({email}) —
// reuse that schema rather than duplicating an identical zod object.
async function resendConfirmationRequest(
  input: ForgotPasswordInput,
): Promise<ResendConfirmationResponse> {
  const payload = forgotPasswordSchema.parse(input);
  const res = await strapi.post<ResendConfirmationResponse>(
    '/api/auth/send-email-confirmation',
    payload,
  );
  return res.data;
}

// Enumeration-soft resend (C-AUTH-SEND-CONFIRM): 200 {email, sent:true} even
// for unknown emails. No token writes, no query-cache updates.
export function useResendConfirmationMutation() {
  return useMutation({ mutationFn: resendConfirmationRequest });
}
