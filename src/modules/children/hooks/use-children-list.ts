'use client';

import { useMemo, useState } from 'react';

import { useDashboardSearchStore, useStudentsQuery } from '@/modules/dashboard';

// C-UI-MYCHILDREN list state: the EXISTING ['dashboard','students'] query (single
// source), the optional "Include archived" re-query, and the existing debounced
// search store's selection used as a client-side name filter (keep the
// use-dashboard-search.store.ts mechanism). Returns everything the screen needs so
// the component stays presentational.
export function useChildrenList() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const query = useStudentsQuery({ includeArchived });
  const allStudentsQuery = useStudentsQuery({ includeArchived: true });
  const selectedStudentId = useDashboardSearchStore((state) => state.selectedStudentId);

  const allRows = useMemo(() => query.data?.data ?? [], [query.data]);
  const allChildren = useMemo(() => allStudentsQuery.data?.data ?? [], [allStudentsQuery.data]);
  const rows = useMemo(
    () => allRows.filter((row) => !selectedStudentId || row.documentId === selectedStudentId),
    [allRows, selectedStudentId],
  );
  const activeCount = useMemo(
    () => allChildren.filter((child) => child.status === 'active').length,
    [allChildren],
  );
  const archivedCount = useMemo(
    () => allChildren.filter((child) => child.status === 'archived').length,
    [allChildren],
  );

  return {
    rows,
    totalCount: allRows.length,
    visibleCount: rows.length,
    allProfileCount: allChildren.length,
    activeCount,
    archivedCount,
    hasAnyChildren: allChildren.length > 0,
    includeArchived,
    setIncludeArchived,
    isLoading: query.isLoading || allStudentsQuery.isLoading,
    isError: query.isError || allStudentsQuery.isError,
    isFetching: query.isFetching || allStudentsQuery.isFetching,
    refetch: async () => Promise.all([query.refetch(), allStudentsQuery.refetch()]),
  };
}
