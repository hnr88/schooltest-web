'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  staffInvitationsResponseSchema,
  type StaffInvitationsQuery,
  type StaffInvitationsResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-PORTAL-016 — GET /api/ops/invitations. Paginated independently of the
// user directory, so an invitation page never borrows a user total.
export const OPS_STAFF_INVITATIONS_QUERY_KEY = ['ops', 'invitations'] as const;

/** School and role are part of the key: a role switch must refetch, not reuse. */
export function staffInvitationsQueryKey(params: StaffInvitationsQuery) {
  return [...OPS_STAFF_INVITATIONS_QUERY_KEY, params] as const;
}

async function fetchStaffInvitations(
  params: StaffInvitationsQuery,
): Promise<StaffInvitationsResponse> {
  const res = await strapi.get<unknown>('/api/ops/invitations', {
    params,
    // D-COMPAT: opt THIS request into the portal contract, which is what adds
    // display_name/invited_at and evaluates expiry from server time.
    opsPortalVersioned: true,
  });
  // Parsed, not cast: a drifted body throws here instead of rendering as a
  // silently empty list, and an unexpected key (a leaked `token`) fails too.
  return staffInvitationsResponseSchema.parse(res.data);
}

export function useStaffInvitationsQuery(params: StaffInvitationsQuery, enabled: boolean) {
  return useQuery({
    queryKey: staffInvitationsQueryKey(params),
    queryFn: () => fetchStaffInvitations(params),
    enabled,
    retry: false,
    // Paging keeps the previous page visible instead of flashing the skeleton.
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
