'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opsActorSchema, type OpsActor } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { OPS_CAPABILITIES_QUERY_KEY } from '@/modules/ops/constants/capabilities.constants';

// C-OPS-PORTAL-031 — the one write a read-only support account may perform:
// renaming ITSELF. The server resolves the user from the JWT alone and keeps
// email read-only; the body is only ever { first_name, last_name }.
async function updateOpsProfile(patch: {
  first_name?: string;
  last_name?: string;
}): Promise<OpsActor> {
  const res = await strapi.patch<{ data?: { actor?: unknown } }>('/api/ops/profile', patch, {
    opsPortalVersioned: true,
  });
  // `{ data: { actor } }` — the shared package exports the actor schema but no
  // profile envelope, so unwrap in plain TS and let the schema be the guard.
  return opsActorSchema.parse(res.data?.data?.actor);
}

export function useUpdateOpsProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpsProfile,
    onSuccess: () => {
      // Actor, capabilities and the auth profile all carry the name.
      void queryClient.invalidateQueries({ queryKey: OPS_CAPABILITIES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
