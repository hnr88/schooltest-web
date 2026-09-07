'use client';

import { useQuery } from '@tanstack/react-query';
import { capabilitiesResultSchema, type CapabilitiesResult } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { OPS_CAPABILITIES_QUERY_KEY } from '@/modules/ops/constants/capabilities.constants';

/**
 * C-OPS-PORTAL-065 — `GET /api/ops/capabilities`.
 *
 * The portal asks the SERVER what this account may do; it never derives
 * authority from the JWT or from a role string it stored at sign-in. The body
 * is parsed through the shared `capabilitiesResultSchema`, so a drifted shape
 * throws here instead of flowing into the UI as a silent "everything is
 * allowed".
 *
 * `opsPortalVersioned` sends `X-Ops-Portal-Version: 1` for this request alone
 * (OPS-009): the header selects a wire shape and conveys no permission.
 */
async function fetchCapabilities(): Promise<CapabilitiesResult> {
  const res = await strapi.get<unknown>('/api/ops/capabilities', { opsPortalVersioned: true });
  return parseDataEnvelope(capabilitiesResultSchema, res.data);
}

export function useCapabilitiesQuery(enabled = true) {
  return useQuery({
    queryKey: OPS_CAPABILITIES_QUERY_KEY,
    queryFn: fetchCapabilities,
    enabled,
    // A role change must land promptly, and the answer is account-specific:
    // never serve it from a previous session's cache. The axios auth-change
    // listener already clears the whole cache on sign-in/out.
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
