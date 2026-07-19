'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { AuthResponse } from '@/modules/auth/types/auth.types';

// C-AUTH-GOOGLE (D18): queryString is the FULL query Google's consent redirect
// delivered to /auth/google/callback (access_token, id_token, raw[...]),
// forwarded verbatim to the api. The response jwt is the real Strapi session —
// the query's own id_token (Google's OIDC token) is never read or stored.
async function googleCallbackRequest(queryString: string): Promise<AuthResponse> {
  const res = await strapi.get<AuthResponse>(`/api/auth/google/callback?${queryString}`);
  return res.data;
}

export function useGoogleCallbackMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: googleCallbackRequest,
    onSuccess: (data) => {
      setToken(data.jwt);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
