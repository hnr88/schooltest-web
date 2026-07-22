'use client';

import { UserSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { AgentCard } from '@/modules/agent-search/components/AgentCard';
import { PAGE_SIZE } from '@/modules/agent-search/constants/agent-search.constants';
import type { useAgentSearchQuery } from '@/modules/agent-search/queries/use-agent-search.query';
import { Alert, Button } from '@/modules/design-system';
import {
  SearchCardSkeletonList,
  SearchEmptyState,
  SearchPagination,
  SearchResultsPanel,
} from '@/modules/search-shared';

const GRID_CLASS = 'grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3';

// Same shared SearchResultsPanel the schools column uses.
function AgentResults({
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

  return (
    <SearchResultsPanel
      slot="agent-search-results"
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
      {isPending ? <SearchCardSkeletonList label={t('loading')} className={GRID_CLASS} /> : null}
      {!isPending && hits.length === 0 ? (
        <SearchEmptyState
          icon={UserSearch}
          title={t('empty.title')}
          sub={t('empty.sub')}
          onReset={onReset}
        />
      ) : null}
      {hits.length > 0 ? (
        <div
          data-slot="agent-card-grid"
          className={cn(
            GRID_CLASS,
            'animate-in duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none',
          )}
        >
          {hits.map((hit) => (
            <AgentCard key={hit.documentId} hit={hit} />
          ))}
        </div>
      ) : null}
    </SearchResultsPanel>
  );
}

export { AgentResults };
