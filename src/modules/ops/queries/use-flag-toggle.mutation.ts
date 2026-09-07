'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  flagTogglePath,
  flagToggleResponseSchema,
  type FlagToggleResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import {
  OPS_FLAGS_QUERY_KEY,
  PLATFORM_SETTINGS_QUERY_KEY,
} from '@/modules/ops/constants/queries.constants';

// C-OPSF-02 — set one feature flag.
//
// `enabled` is sent EXPLICITLY as the target value; there is no flip verb on
// the route and inferring one from the rendered switch would race a concurrent
// toggle by another operator (last-writer-wins on a value nobody chose).
//
// Not confirm-gated, unlike the three settings editors: a flag is a reversible
// boolean the same control can put back, whereas maintenance mode closes the
// site and the rate limit can lock out sign-in. The consoles' consequence
// language should track that difference rather than dulling every action with
// the same dialog.
interface FlagToggleArgs {
  key: string;
  enabled: boolean;
}

async function toggleFlag({ key, enabled }: FlagToggleArgs): Promise<FlagToggleResponse['data']> {
  const res = await strapi.put<unknown>(flagTogglePath(key), { enabled });
  const parsed = flagToggleResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useFlagToggleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFlag,
    // Three caches move: the registry itself, the settings row that physically
    // stores `feature_flags`, and the audit ledger the server writes a
    // `flag.toggle` row into.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: OPS_FLAGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
