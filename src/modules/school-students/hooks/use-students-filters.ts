'use client';

import { useEffect, useState } from 'react';

import type { SchoolStudentLevelFilter } from '@/modules/school-students/types/school-students.types';

import type { StudentsFilters } from '@/modules/school-students/types/hooks.types';
import {
  ROSTER_STATUS,
  SEARCH_DEBOUNCE_MS,
} from '@/modules/school-students/constants/hooks.constants';

// The spec §4 roster filters: a name search and a class, both C-CHD-01 query
// params, plus the level. Search and class narrow server-side, level narrows the
// returned rows (the contract has no level param), and the three compose — none
// of them clears another. Any change resets to page 1 so a narrowed result set
// never strands the user past its last page.
export function useStudentsFilters(): StudentsFilters {
  const [classId, setClassId] = useState('all');
  const [level, setLevel] = useState<SchoolStudentLevelFilter>('all');
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

  const selectClass = (value: string) => {
    setClassId(value);
    setPage(1);
  };
  const selectLevel = (value: SchoolStudentLevelFilter) => {
    setLevel(value);
    setPage(1);
  };

  return {
    query: { status: ROSTER_STATUS, classId, q, page },
    search,
    level,
    setSearch,
    selectClass,
    selectLevel,
    setPage,
    filtered: classId !== 'all' || level !== 'all' || q !== '',
  };
}
