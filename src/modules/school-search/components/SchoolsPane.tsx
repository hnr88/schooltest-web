'use client';

import { useMemo } from 'react';

import { MapToggle } from '@/modules/school-search/components/MapToggle';
import { MobileMapSheet } from '@/modules/school-search/components/MobileMapSheet';
import { SchoolFilterPanel } from '@/modules/school-search/components/SchoolFilterPanel';
import { SchoolResultsGrid } from '@/modules/school-search/components/SchoolResultsGrid';
import { SchoolsSplitLayout } from '@/modules/school-search/components/SchoolsSplitLayout';
import { SortChip } from '@/modules/school-search/components/SortChip';
import { storeToRequest } from '@/modules/school-search/lib/store-to-request';
import { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// C-UI-SEARCH-SCHOOLS + C-UI-SEARCH-MAP Schools pane (mode==='schools'): the filter
// chip row + the Airbnb-style split (cards left, sticky Leaflet map right on lg+, a
// full-bleed sheet on mobile). The map plots the SAME query hits the cards render
// (M2 option A — one network call). Individual selectors avoid whole-store churn.
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
  const isMapOpen = useSchoolSearchStore((s) => s.isMapOpen);
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
  const hits = query.data?.data ?? [];

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-12">
      <aside className="min-w-0 lg:col-span-3">
        <SchoolFilterPanel />
      </aside>
      <div data-slot="school-search-workspace" className="flex min-w-0 flex-col gap-4 lg:col-span-9">
        <div data-slot="school-search-toolbar" className="flex flex-wrap items-center gap-3">
          <SortChip />
          <MapToggle />
          <MobileMapSheet hits={hits} />
        </div>
        <SchoolsSplitLayout isMapOpen={isMapOpen} hits={hits}>
          <SchoolResultsGrid
            query={query}
            isMapOpen={isMapOpen}
            onRetry={() => void query.refetch()}
            onReset={reset}
            onPageChange={setPage}
          />
        </SchoolsSplitLayout>
      </div>
    </div>
  );
}

export { SchoolsPane };
