'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { FeeRangeChip } from '@/modules/school-search/components/FeeRangeChip';
import { SchoolFilterChips } from '@/modules/school-search/components/SchoolFilterChips';
import { SchoolResultsGrid } from '@/modules/school-search/components/SchoolResultsGrid';
import { SchoolSearchInput } from '@/modules/school-search/components/SchoolSearchInput';
import { SortChip } from '@/modules/school-search/components/SortChip';
import { storeToRequest } from '@/modules/school-search/lib/store-to-request';
import { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// C-UI-SEARCH-SCHOOLS §5.4: assembles input + chips + results, all driven by the
// Zustand store through `storeToRequest` into the TanStack query. Individual
// selectors avoid whole-store subscription re-render churn.
function SchoolSearchScreen() {
  const t = useTranslations('SchoolSearch');
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
    <main className="flex flex-1 flex-col gap-6 px-8 py-7 duration-300 ease-out animate-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-navy-950">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <SchoolSearchInput />
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
    </main>
  );
}

export { SchoolSearchScreen };
