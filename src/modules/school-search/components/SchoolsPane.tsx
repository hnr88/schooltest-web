'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MapPanelFrame } from '@/modules/design-system';
import { MapToggle } from '@/modules/school-search/components/MapToggle';
import { MobileMapSheet } from '@/modules/school-search/components/MobileMapSheet';
import { SchoolFiltersDialog } from '@/modules/school-search/components/SchoolFiltersDialog';
import { SchoolResults } from '@/modules/school-search/components/SchoolResults';
// Direct import (never the module barrel) so next/dynamic(ssr:false) is preserved.
import { SchoolResultsMapPanel } from '@/modules/school-search/components/SchoolResultsMapPanel';
import { SchoolSortMenu } from '@/modules/school-search/components/SchoolSortMenu';
import { useSchoolFilterChips } from '@/modules/school-search/hooks/use-school-filter-chips';
import { useSchoolSearchPane } from '@/modules/school-search/hooks/use-school-search-pane';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import { SearchAppliedChips, SearchToolbar } from '@/modules/search-shared';

// THE WORKSPACE, laid out as the design draws it (spec 01 §8.2/§8.3): a full-width
// filter bar over a `340px 1fr` body — a fixed result rail against a fluid map. The
// filters that used to occupy a third 248px column now live in the §8.6 overlay the
// filter bar opens, at every width.
// The row is `lg:min-h-0 lg:h-full`, which is what binds each pane's internal
// scroller to the viewport instead of growing the document. Below `lg` the panes
// stack and the map moves into its sheet.
// The map column is a NAMED complementary landmark so it is distinguishable from any
// other <aside> — axe flags unnamed duplicate landmarks.
function SchoolsPane() {
  const t = useTranslations('SchoolSearch');
  const { query, activeFilterCount } = useSchoolSearchPane();
  const chips = useSchoolFilterChips();
  const isMapOpen = useSchoolSearchStore((s) => s.isMapOpen);
  const setPage = useSchoolSearchStore((s) => s.setPage);
  const reset = useSchoolSearchStore((s) => s.reset);
  const hits = query.data?.data ?? [];
  const total = query.data?.meta.pagination.total ?? 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:h-full">
      <SearchToolbar
        count={t('resultsCount', { count: total })}
        filters={<SchoolFiltersDialog activeCount={activeFilterCount} resultCount={total} />}
        chips={
          <SearchAppliedChips
            chips={chips}
            emptyLabel={t('filterPanel.noFilters')}
            removeLabel={(label) => t('filterPanel.remove', { label })}
          />
        }
        actions={
          <>
            <MobileMapSheet hits={hits} />
            <SchoolSortMenu />
            <MapToggle />
          </>
        }
      />
      <div
        data-slot="school-search-workspace"
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-5 lg:grid lg:h-full',
          isMapOpen && 'lg:grid-cols-search-split',
        )}
      >
        <SchoolResults
          query={query}
          isMapOpen={isMapOpen}
          onRetry={() => void query.refetch()}
          onReset={reset}
          onPageChange={setPage}
        />
        {isMapOpen ? (
          <aside
            data-slot="school-map-column"
            aria-label={t('map.region')}
            className="hidden min-h-0 min-w-0 lg:block"
          >
            <MapPanelFrame
              label={t('map.region')}
              sticky={false}
              className="h-full min-h-105 rounded-card border-transparent"
            >
              <SchoolResultsMapPanel hits={hits} />
            </MapPanelFrame>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export { SchoolsPane };
