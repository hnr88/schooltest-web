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
  const selectedStudentId = useDashboardSearchStore((state) => state.selectedStudentId);

  const allRows = useMemo(() => query.data?.data ?? [], [query.data]);
  const rows = useMemo(
    () => allRows.filter((row) => !selectedStudentId || row.documentId === selectedStudentId),
    [allRows, selectedStudentId],
  );

  return {
    rows,
    totalCount: allRows.length,
    visibleCount: rows.length,
    includeArchived,
    setIncludeArchived,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
