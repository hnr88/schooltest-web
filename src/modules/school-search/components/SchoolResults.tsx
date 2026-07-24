'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Alert, Button } from '@/modules/design-system';
import { SchoolCard } from '@/modules/school-search/components/SchoolCard';
import { PAGE_SIZE } from '@/modules/school-search/constants/school-search.constants';
import type { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import {
  SearchCardSkeletonList,
  SearchEmptyState,
  SearchPagination,
  SearchResultsPanel,
} from '@/modules/search-shared';

// The results COLUMN of the design's two-column body (spec 01 §8.3/§8.4): the four
// query states and the pinned pager inside the shared SearchResultsPanel, so schools
// and agents render one component and not two.
// The list is ONE column while the map holds the other track (the design's 340px
// rail). With the map collapsed (the default) the full-width results panel relaxes
// to two columns from `sm` and three from `xl`.
function SchoolResults({
  query,
  onRetry,
  onReset,
  onPageChange,
  isMapOpen,
}: {
  query: ReturnType<typeof useSchoolSearchQuery>;
  onRetry: () => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  isMapOpen: boolean;
}) {
  const t = useTranslations('SchoolSearch');
  const { data, isPending, isError } = query;

  if (isError) {
    return (
      <Alert
        variant="error"
        title={t('error.title')}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('error.retry')}
          </Button>
        }
      >
        {t('error.body')}
      </Alert>
    );
  }

  const pagination = data?.meta.pagination;
  const hits = data?.data ?? [];
  const gridClass = cn('grid grid-cols-1 gap-3', !isMapOpen && 'sm:grid-cols-2 xl:grid-cols-3');

  return (
    <SearchResultsPanel
      slot="school-search-results"
      regionLabel={t('resultsRegion')}
      footer={
        pagination && pagination.pageCount > 1 ? (
          <SearchPagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            total={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={onPageChange}
          />
        ) : null
      }
    >
      {isPending ? <SearchCardSkeletonList label={t('loading')} className={gridClass} /> : null}
      {!isPending && hits.length === 0 ? (
        <SearchEmptyState
          icon={SearchX}
          title={t('empty.title')}
          sub={t('empty.sub')}
          onReset={onReset}
        />
      ) : null}
      {hits.length > 0 ? (
        <div
          data-slot="school-card-grid"
          className={cn(
            gridClass,
            'animate-in duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none',
          )}
        >
          {hits.map((hit) => (
            <SchoolCard key={hit.documentId} hit={hit} />
          ))}
        </div>
      ) : null}
    </SearchResultsPanel>
  );
}

export { SchoolResults };
