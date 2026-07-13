'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { registerSchema, type RegisterInput } from '@/modules/auth/schemas/auth.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { AuthResponse } from '@/modules/auth/types/auth.types';

async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const payload = registerSchema.parse(input);
  const res = await strapi.post<AuthResponse>('/api/auth/local/register', payload);
  return res.data;
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
