'use client';

import { useMemo } from 'react';

import { FeeRangeChip } from '@/modules/school-search/components/FeeRangeChip';
import { SchoolFilterChips } from '@/modules/school-search/components/SchoolFilterChips';
import { SchoolResultsGrid } from '@/modules/school-search/components/SchoolResultsGrid';
import { SortChip } from '@/modules/school-search/components/SortChip';
import { storeToRequest } from '@/modules/school-search/lib/store-to-request';
import { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// C-UI-SEARCH-SCHOOLS Schools pane (mode==='schools'): the former SchoolSearchScreen
// minus the heading + §5.4 search input — both hoisted to C-UI-SEARCH-UNIFIED (038).
// Renders from the filter chip row down, driven entirely by the Zustand store through
// `storeToRequest` into the TanStack query. Individual selectors avoid whole-store
// subscription re-render churn.
function SchoolsPane() {
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
  const setPage = useSchoolSearchStore((s) => s.setPage);
  const reset = useSchoolSearchStore((s) => s.reset);

  const request = useMemo(
    () =>
      storeToRequest({
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

  const query = useSchoolSearchQuery(request);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <SchoolFilterChips />
        <FeeRangeChip />
        <SortChip />
      </div>
      <SchoolResultsGrid
        query={query}
        onRetry={() => void query.refetch()}
        onReset={reset}
        onPageChange={setPage}
      />
    </div>
  );
}

export { SchoolsPane };
