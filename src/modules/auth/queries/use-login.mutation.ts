'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { loginSchema, type LoginInput } from '@/modules/auth/schemas/auth.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { AuthResponse } from '@/modules/auth/types/auth.types';

async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  // Validate on the client boundary too — never trust caller-supplied shapes.
  const payload = loginSchema.parse(input);
  const res = await strapi.post<AuthResponse>('/api/auth/local', payload);
  return res.data;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
