'use client';

import { UserSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { AgentCard } from '@/modules/agent-search/components/AgentCard';
import { AgentCardSkeleton } from '@/modules/agent-search/components/AgentCardSkeleton';
import { PAGE_SIZE } from '@/modules/agent-search/constants/agent-search.constants';
import type { useAgentSearchQuery } from '@/modules/agent-search/queries/use-agent-search.query';
import { Alert, Button } from '@/modules/design-system';
import {
  SearchCardSkeletonGrid,
  SearchEmptyState,
  SearchPagination,
} from '@/modules/search-shared';

// Owns the results zone: count header, the four query states (loading skeletons /
// error Alert / empty CTA / grid) and pagination. Refetches keep previous data and
// dim the grid (`opacity-60`) instead of hard-swapping to skeletons.
function AgentResultsGrid({
  query,
  onRetry,
  onReset,
  onPageChange,
}: {
  query: ReturnType<typeof useAgentSearchQuery>;
  onRetry: () => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations('AgentSearch');
  const { data, isPending, isError, isFetching } = query;

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
    return <SearchCardSkeletonGrid label={t('loading')} card={<AgentCardSkeleton />} />;
  }

  const hits = data.data;
  const { total, page, pageCount } = data.meta.pagination;

  if (hits.length === 0) {
    return (
      <SearchEmptyState
        icon={UserSearch}
        title={t('empty.title')}
        sub={t('empty.sub')}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <p aria-live="polite" className="text-caption text-body">
        {t('resultsCount', { count: total })}
      </p>
      <div
        className={cn(
          'grid grid-cols-1 gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none md:grid-cols-2',
          isFetching && 'opacity-60',
        )}
      >
        {hits.map((hit) => (
          <AgentCard key={hit.documentId} hit={hit} />
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

export { AgentResultsGrid };
