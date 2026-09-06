'use client';

import { useState } from 'react';

import type { YearBand } from '@/modules/classes/types/constants.types';
import type { ClassesListQuery, ClassListStatus } from '@/modules/ops/lib/ops-classes-contract';

/** The extra "no filter" chip value; never sent to the server. */
export const OPS_CLASSES_FILTER_ALL = 'all' as const;
export const OPS_CLASSES_PAGE_SIZE = 25;

export type OpsClassesStatusFilter = ClassListStatus | typeof OPS_CLASSES_FILTER_ALL;
export type OpsClassesYearFilter = YearBand | typeof OPS_CLASSES_FILTER_ALL;

export interface OpsClassesFilterState {
  status: OpsClassesStatusFilter;
  yearBand: OpsClassesYearFilter;
  search: string;
  /** Teacher documentId from the ?teacher= deep-link, when present. */
  teacher: string | null;
  /** True while any filter narrows the list — drives "nothing matches" vs "none yet". */
  isFiltered: boolean;
  /** Exactly the query the shared contract accepts; empty values are omitted. */
  query: ClassesListQuery;
  setStatus: (status: OpsClassesStatusFilter) => void;
  setYearBand: (yearBand: OpsClassesYearFilter) => void;
  setSearch: (search: string) => void;
  goToPage: (page: number) => void;
}

/**
 * OPS-038 Classes-tab filter state. Changing a filter always returns to page 1
 * — keeping the old page number would ask the server for a page the narrowed
 * result set may not have, and the tab would read as empty when it is not.
 *
 * `teacher` is not local state: it arrives through the ?teacher= deep-link from
 * the staff directory and is forwarded verbatim into the query. Clearing it is
 * the tab's job (it owns the URL); the hook only folds it into the request.
 */
export function useClassesFilter(teacher?: string | null): OpsClassesFilterState {
  const [status, setStatusValue] = useState<OpsClassesStatusFilter>(OPS_CLASSES_FILTER_ALL);
  const [yearBand, setYearBandValue] = useState<OpsClassesYearFilter>(OPS_CLASSES_FILTER_ALL);
  const [search, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const trimmed = search.trim();
  const teacherId = teacher?.trim() ?? '';
  return {
    status,
    yearBand,
    search,
    teacher: teacherId === '' ? null : teacherId,
    isFiltered:
      status !== OPS_CLASSES_FILTER_ALL ||
      yearBand !== OPS_CLASSES_FILTER_ALL ||
      trimmed !== '' ||
      teacherId !== '',
    query: {
      page,
      pageSize: OPS_CLASSES_PAGE_SIZE,
      ...(status === OPS_CLASSES_FILTER_ALL ? {} : { status }),
      ...(yearBand === OPS_CLASSES_FILTER_ALL ? {} : { year_band: yearBand }),
      ...(trimmed === '' ? {} : { q: trimmed }),
      ...(teacherId === '' ? {} : { teacher: teacherId }),
    },
    setStatus: (next) => {
      setPage(1);
      setStatusValue(next);
    },
    setYearBand: (next) => {
      setPage(1);
      setYearBandValue(next);
    },
    setSearch: (next) => {
      setPage(1);
      setSearchValue(next);
    },
    goToPage: (next) => setPage(Math.max(1, next)),
  };
}
