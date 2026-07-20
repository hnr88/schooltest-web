'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button } from '@/modules/design-system';
import { SchoolCard } from '@/modules/school-search/components/SchoolCard';
import { SchoolCardSkeleton } from '@/modules/school-search/components/SchoolCardSkeleton';
import { PAGE_SIZE } from '@/modules/school-search/constants/school-search.constants';
import type { useSchoolSearchQuery } from '@/modules/school-search/queries/use-school-search.query';
import {
  SearchCardSkeletonGrid,
  SearchEmptyState,
  SearchPagination,
} from '@/modules/search-shared';

// Owns the results zone: count header, the four query states (loading skeletons /
// error Alert / empty CTA / grid) and pagination. Refetches keep previous data
// visible without degrading readable card contrast. `isMapOpen` narrows the grid
// to two columns while the split map occupies the right rail.
function SchoolResultsGrid({
  query,
  isMapOpen,
  onRetry,
  onReset,
  onPageChange,
}: {
  query: ReturnType<typeof useSchoolSearchQuery>;
  isMapOpen: boolean;
  onRetry: () => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
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

  if (isPending) {
    return <SearchCardSkeletonGrid label={t('loading')} card={<SchoolCardSkeleton />} />;
  }

  const hits = data.data;
  const { total, page, pageCount } = data.meta.pagination;

  if (hits.length === 0) {
    return (
      <SearchEmptyState
        icon={SearchX}
        title={t('empty.title')}
        sub={t('empty.sub')}
        onReset={onReset}
      />
    );
  }

  return (
    <div
      data-slot="school-search-results"
      className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <p aria-live="polite" className="text-caption text-muted-foreground">
        {t('resultsCount', { count: total })}
      </p>
      <div
        data-slot="school-card-grid"
        className={
          isMapOpen
            ? 'grid grid-cols-1 gap-4'
            : 'grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'
        }
      >
        {hits.map((hit) => (
          <SchoolCard key={hit.documentId} hit={hit} />
        ))}
      </div>
      <SearchPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export { SchoolResultsGrid };
