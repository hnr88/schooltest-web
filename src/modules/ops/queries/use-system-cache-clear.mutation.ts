'use client';

import { useMutation } from '@tanstack/react-query';
import {
  RestContractViolation,
  systemCacheClearRequestSchema,
  systemCacheClearResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * Ledger row 5c — C-OPSY-01 POST /api/ops/system/cache/clear.
 *
 * Real Redis SCAN+DEL over the requested scope's key patterns. The server
 * counts what it actually deleted and echoes the scope; the UI renders that
 * number, never a rounded-up success.
 */
async function clearSystemCache(input: systemCacheClearRequestSchema_input) {
  const parsedInput = systemCacheClearRequestSchema.safeParse(input);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>('/api/ops/system/cache/clear', parsedInput.data);
  const parsed = systemCacheClearResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

type systemCacheClearRequestSchema_input = {
  scope: 'all' | 'settings' | 'search' | 'legal';
};

export function useSystemCacheClearMutation() {
  return useMutation({ mutationFn: clearSystemCache });
}
