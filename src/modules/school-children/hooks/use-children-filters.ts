'use client';

import { useEffect, useState } from 'react';

import type {
  SchoolChildStatusFilter,
  SchoolChildrenQuery,
} from '@/modules/school-children/types/school-children.types';

const SEARCH_DEBOUNCE_MS = 300;

export interface ChildrenFilters {
  query: SchoolChildrenQuery;
  search: string;
  setSearch: (value: string) => void;
  selectStatus: (value: SchoolChildStatusFilter) => void;
  selectClass: (value: string) => void;
  setPage: (page: number) => void;
  filtered: boolean;
}

// The roster filter state: status, class, a debounced name search and the
// page. Any filter change resets to page 1 so a narrowed result set never
// strands the user past its last page.
export function useChildrenFilters(): ChildrenFilters {
  const [status, setStatus] = useState<SchoolChildStatusFilter>('all');
  const [classId, setClassId] = useState('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const selectStatus = (value: SchoolChildStatusFilter) => {
    setStatus(value);
    setPage(1);
  };
  const selectClass = (value: string) => {
    setClassId(value);
    setPage(1);
  };

  return {
    query: { status, classId, q, page },
    search,
    setSearch,
    selectStatus,
    selectClass,
    setPage,
    filtered: status !== 'all' || classId !== 'all' || q !== '',
  };
}
