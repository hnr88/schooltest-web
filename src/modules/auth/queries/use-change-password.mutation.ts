'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/modules/auth/schemas/change-password.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { AuthResponse } from '@/modules/auth/types/auth.types';

async function changePasswordRequest(input: ChangePasswordInput): Promise<AuthResponse> {
  // Validate on the client boundary too — never trust caller-supplied shapes.
  // The parsed payload carries exactly the three contract keys (C-AUTH-CHANGE
  // is .noUnknown(): extra keys would 400).
  const payload = changePasswordSchema.parse(input);
  const res = await strapi.post<AuthResponse>('/api/auth/change-password', payload);
  return res.data;
}

// Success returns a fresh 7d jwt + sanitized user (C-AUTH-CHANGE) — the exact
// store/query-cache handoff of use-login.mutation.ts. Old jwts stay valid (no
// session revocation), so this only swaps the stored token. Errors write
// nothing (no token, no cache).
export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
