'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/modules/auth/schemas/forgot-password.schema';
import type { ForgotPasswordResponse } from '@/modules/auth/types/auth.types';

async function forgotPasswordRequest(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
  // Validate on the client boundary too — never trust caller-supplied shapes.
  const payload = forgotPasswordSchema.parse(input);
  const res = await strapi.post<ForgotPasswordResponse>('/api/auth/forgot-password', payload);
  return res.data;
}

// Enumeration-safe request (C-AUTH-FORGOT): 200 {ok:true} for every email.
// No token writes, no query-cache updates.
export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPasswordRequest });
}
