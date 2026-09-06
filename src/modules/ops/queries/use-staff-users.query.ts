'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OwnershipTransferOperation,
  PAGE_SIZE_DEFAULT,
  RestContractViolation,
  StaffUsersOperation,
  ownershipTransferResponseSchema,
  staffUsersResponseSchema,
  type OwnershipTransferResult,
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

/**
 * C-OPS-PORTAL-027 (task 17) — the D-OWN ownership transfer, beside the admins
 * directory it acts on so the write and the read it invalidates cannot drift.
 *
 * `expected_owner_documentId` is the owner the operator SAW — read from the
 * school detail's `owner_documentId`, never invented and never re-fetched just
 * before sending, because a value fetched to satisfy the guard would defeat it.
 * `null` is a real value here: it asserts "this school had no owner", the state
 * the backfill leaves on a legacy school whose ownership was ambiguous. The
 * server answers 409 when the school has moved on, and the conflict carries the
 * current owner so the UI can show the truth without racing another read.
 */
export async function transferSchoolOwnership(args: {
  schoolDocumentId: string;
  ownerDocumentId: string;
  expectedOwnerDocumentId: string | null;
}): Promise<OwnershipTransferResult> {
  const res = await strapi.post<unknown>(
    OwnershipTransferOperation.path.replace('{documentId}', args.schoolDocumentId),
    {
      owner_documentId: args.ownerDocumentId,
      expected_owner_documentId: args.expectedOwnerDocumentId,
    },
    { opsPortalVersioned: true },
  );
  const parsed = ownershipTransferResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

/**
 * Both reads that describe ownership are dropped: the admins directory renders
 * the owner badge, and the school detail carries `owner_documentId` — which is
 * the very value the NEXT transfer must quote, so a stale one would make the
 * following attempt 409 for no reason.
 *
 * `/api/ops/capabilities` is deliberately NOT invalidated. It describes the
 * signed-in OPS operator's own role and flags, which a school's ownership does
 * not change, and it already runs at `staleTime: 0`.
 */
export function useOwnershipTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferSchoolOwnership,
    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({
        queryKey: staffUsersSchoolKey(input.schoolDocumentId),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    },
  });
}
