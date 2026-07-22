'use client';

import { useMemo } from 'react';

import { countActiveSchoolFilters } from '@/modules/school-search/lib/active-filter-count';
import { storeToRequest } from '@/modules/school-search/lib/store-to-request';
import { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// Individual selectors (never a whole-store subscription) → the request object →
// the TanStack query. Extracted from SchoolsPane so the pane stays a layout file.
export function useSchoolSearchPane() {
  const q = useSchoolSearchStore((s) => s.q);
  const states = useSchoolSearchStore((s) => s.states);
  const schoolTypes = useSchoolSearchStore((s) => s.schoolTypes);
  const sectors = useSchoolSearchStore((s) => s.sectors);
  const levels = useSchoolSearchStore((s) => s.levels);
  const atarAvailable = useSchoolSearchStore((s) => s.atarAvailable);
  const elicos = useSchoolSearchStore((s) => s.elicos);
  const scholarshipAvailable = useSchoolSearchStore((s) => s.scholarshipAvailable);
  const feeMin = useSchoolSearchStore((s) => s.feeMin);
  const feeMax = useSchoolSearchStore((s) => s.feeMax);
  const sortBy = useSchoolSearchStore((s) => s.sortBy);
  const page = useSchoolSearchStore((s) => s.page);

  const filters = useMemo(
    () => ({
      q,
      states,
      schoolTypes,
      sectors,
      levels,
      atarAvailable,
      elicos,
      scholarshipAvailable,
      feeMin,
      feeMax,
      sortBy,
      page,
    }),
    [
      q,
      states,
      schoolTypes,
      sectors,
      levels,
      atarAvailable,
      elicos,
      scholarshipAvailable,
      feeMin,
      feeMax,
      sortBy,
      page,
    ],
  );

  const query = useSchoolSearchQuery(useMemo(() => storeToRequest(filters), [filters]));

  return { query, activeFilterCount: countActiveSchoolFilters(filters) };
}
