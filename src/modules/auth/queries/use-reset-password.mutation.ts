'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { resetPasswordSchema } from '@/modules/auth/schemas/reset-password.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { AuthResponse, ResetPasswordRequest } from '@/modules/auth/types/auth.types';

async function resetPasswordRequest({
  code,
  ...input
}: ResetPasswordRequest): Promise<AuthResponse> {
  // Validate on the client boundary too — never trust caller-supplied shapes.
  const payload = { code, ...resetPasswordSchema.parse(input) };
  const res = await strapi.post<AuthResponse>('/api/auth/reset-password', payload);
  return res.data;
}

// Success stores C-AUTH-RESET's fresh 7d jwt + sanitized user before the card
// renders its explicit completion state. Errors write nothing.
export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
