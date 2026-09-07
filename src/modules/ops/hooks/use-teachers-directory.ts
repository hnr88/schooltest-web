'use client';

import { useMemo, useState } from 'react';
import type { TeachersListQuery } from '@schooltest/ops-contracts';

import { useDebouncedValue } from '@/modules/dashboard';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import {
  OPS_TEACHERS_FILTER_ALL,
  type OpsTeachersDirectoryState,
  type OpsTeachersRoleFilter,
  type OpsTeachersStatusFilter,
} from '@/modules/ops/types/teachers-list.types';

const SEARCH_DEBOUNCE_MS = 200;
const PAGE_SIZE = 25;

const INITIAL: OpsTeachersDirectoryState = {
  page: 1,
  q: '',
  role: OPS_TEACHERS_FILTER_ALL,
  status: OPS_TEACHERS_FILTER_ALL,
};

/**
 * C-OPS-PORTAL-021 (OPS-031) directory state: search, role and status filters
 * and the page. Every filter is sent to the API — the search reaches all
 * eligible candidates instead of filtering one already-truncated page — and any
 * filter change resets to page 1, because page 4 of the old result set is not
 * page 4 of the new one.
 */
export function useOpsTeachersDirectory(schoolDocumentId: string, open: boolean) {
  const [state, setState] = useState<OpsTeachersDirectoryState>(INITIAL);
  const debouncedQ = useDebouncedValue(state.q.trim(), SEARCH_DEBOUNCE_MS);

  const query = useMemo<TeachersListQuery>(
    () => ({
      page: state.page,
      pageSize: PAGE_SIZE,
      ...(debouncedQ.length > 0 ? { q: debouncedQ } : {}),
      ...(state.role !== OPS_TEACHERS_FILTER_ALL ? { role: state.role } : {}),
      ...(state.status !== OPS_TEACHERS_FILTER_ALL
        ? { blocked: state.status === 'suspended' }
        : {}),
    }),
    [debouncedQ, state.page, state.role, state.status],
  );

  return {
    state,
    query,
    filtered:
      debouncedQ.length > 0 ||
      state.role !== OPS_TEACHERS_FILTER_ALL ||
      state.status !== OPS_TEACHERS_FILTER_ALL,
    listQuery: useTeachersListQuery(schoolDocumentId, query, open),
    setQ: (q: string) => setState((prev) => ({ ...prev, q, page: 1 })),
    setRole: (role: OpsTeachersRoleFilter) => setState((prev) => ({ ...prev, role, page: 1 })),
    setStatus: (status: OpsTeachersStatusFilter) =>
      setState((prev) => ({ ...prev, status, page: 1 })),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
  };
}
