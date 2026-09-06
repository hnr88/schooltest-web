'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  PAGE_SIZE_DEFAULT,
  RestContractViolation,
  StaffUsersOperation,
  staffUsersResponseSchema,
  type StaffUserRole,
  type StaffUsersResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPS-PORTAL-015 — the accepted-accounts directory behind the Admins and
// Teachers tabs. Three things this hook deliberately does NOT do:
//  - it never accepts a bare array. The endpoint answers
//    `{ data, meta.pagination }`; the old admins hook tolerated either shape,
//    which meant a drifted response was silently rendered as a complete list
//    with no way to know a second page existed.
//  - it never invents rows. Pending invitations are a different read
//    (C-OPS-PORTAL-016) with a different row identity.
//  - it never widens access. `opsPortalVersioned` adds the wire-shape header
//    only; the bearer token still decides what the caller may see.
export interface StaffUsersArgs {
  schoolDocumentId: string;
  role: StaffUserRole;
  page: number;
  /** Server-side search. The contract declares it; the client never filters. */
  q?: string;
  /** Server-side suspended filter. Undefined means "not filtered". */
  blocked?: boolean;
}

/** School AND role are part of the key: the Admins and Teachers tabs read the
 *  same endpoint and must never share a cache entry. */
export function staffUsersQueryKey({ schoolDocumentId, role, page, q, blocked }: StaffUsersArgs) {
  return ['ops', 'staff-users', schoolDocumentId, role, page, q ?? '', blocked ?? null] as const;
}

/** Every cached page of one school's directory — for post-mutation refetch. */
export function staffUsersSchoolKey(schoolDocumentId: string) {
  return ['ops', 'staff-users', schoolDocumentId] as const;
}

async function fetchStaffUsers(args: StaffUsersArgs): Promise<StaffUsersResponse> {
  const res = await strapi.get<unknown>(StaffUsersOperation.path, {
    params: {
      school: args.schoolDocumentId,
      role: args.role,
      page: args.page,
      pageSize: PAGE_SIZE_DEFAULT,
      // Omitted rather than sent empty: the contract is strict, and an empty
      // `q` would be a filter for "" instead of no filter at all.
      ...(args.q === undefined || args.q === '' ? {} : { q: args.q }),
      ...(args.blocked === undefined ? {} : { blocked: args.blocked }),
    },
    opsPortalVersioned: true,
  });
  const parsed = staffUsersResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useStaffUsersQuery(args: StaffUsersArgs, enabled: boolean) {
  return useQuery({
    queryKey: staffUsersQueryKey(args),
    queryFn: () => fetchStaffUsers(args),
    enabled: enabled && Boolean(args.schoolDocumentId),
    // Paging must not blank the table: the previous page stays on screen while
    // the next one loads, so the pager cannot be double-clicked past the end.
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    retry: false,
  });
}
