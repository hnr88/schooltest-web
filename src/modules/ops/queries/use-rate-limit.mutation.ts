'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OpsRateLimitOperation,
  RestContractViolation,
  rateLimitResponseSchema,
  type RateLimitBody,
  type RateLimitResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSF-05 — the auth rate limit.
//
// `window_ms` is sent in the snake_case form the response uses. The controller
// also accepts `windowMs`, but sending one name and reading another is how a
// pair like this drifts.
//
// Consequential in a way that is easy to underestimate: this governs
// `POST /api/auth/local`, so a too-small `max` locks operators (and every e2e
// suite) out of sign-in. Hence the confirm gate, and hence client-side bounds
// that mirror the server's own rather than trusting free numeric input.
async function setRateLimit(body: RateLimitBody): Promise<RateLimitResponse['data']> {
  const res = await strapi.put<unknown>(OpsRateLimitOperation.path, body);
  const parsed = rateLimitResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useRateLimitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setRateLimit,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
