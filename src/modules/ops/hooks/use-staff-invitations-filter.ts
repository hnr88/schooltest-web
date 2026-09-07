'use client';

import { useMemo, useState } from 'react';

import type { StaffInvitationsQuery } from '@schooltest/ops-contracts';

import type { StaffInvitationsFilterState } from '@/modules/ops/types/staff-invitations.types';

/** The sentinel for "no filter", kept out of the contract's own enums. */
export const STAFF_INVITATION_FILTER_ALL = 'all';

const PAGE_SIZE = 25;

/**
 * Filter and paging state for the invitation dialog. Every filter is a SERVER
 * query parameter, never a client-side slice of one page: filtering client-side
 * would leave the operator with a count that describes rows they cannot see.
 * Changing a filter resets to page 1, so the pager can never point past the end
 * of the newly filtered set.
 */
export function useStaffInvitationsFilter(schoolDocumentId: string): StaffInvitationsFilterState {
  const [role, setRole] = useState<string>(STAFF_INVITATION_FILTER_ALL);
  const [status, setStatus] = useState<string>(STAFF_INVITATION_FILTER_ALL);
  const [page, setPage] = useState(1);

  const params = useMemo<StaffInvitationsQuery>(
    () => ({
      school: schoolDocumentId,
      page,
      pageSize: PAGE_SIZE,
      ...(role === STAFF_INVITATION_FILTER_ALL
        ? {}
        : { role: role as StaffInvitationsQuery['role'] }),
      ...(status === STAFF_INVITATION_FILTER_ALL
        ? {}
        : { status: status as StaffInvitationsQuery['status'] }),
    }),
    [schoolDocumentId, page, role, status],
  );

  return {
    params,
    role,
    status,
    page,
    isFiltered: role !== STAFF_INVITATION_FILTER_ALL || status !== STAFF_INVITATION_FILTER_ALL,
    chooseRole: (value: string) => {
      setRole(value);
      setPage(1);
    },
    chooseStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    goToPage: setPage,
  };
}
