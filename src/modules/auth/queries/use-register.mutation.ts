'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { registerSchema, type RegisterInput } from '@/modules/auth/schemas/auth.schema';
import type { RegisterResponse } from '@/modules/auth/types/auth.types';

async function registerRequest(input: RegisterInput): Promise<RegisterResponse> {
  const payload = registerSchema.parse(input);
  const res = await strapi.post<RegisterResponse>('/api/auth/local/register', payload);
  return res.data;
}

// D-AUTH-1 (C-AUTH-REGISTER, BREAKING): with email confirmation on the
// register response is `{ user }` with NO jwt — nothing to store, no
// ['auth','me'] cache to prime. The caller swaps to the check-your-email
// state; the jwt only exists after the emailed link is redeemed and the
// parent signs in.
export function useRegisterMutation() {
  return useMutation({ mutationFn: registerRequest });
}
