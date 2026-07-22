'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { AgentFiltersDialog } from '@/modules/agent-search/components/AgentFiltersDialog';
import { AgentResults } from '@/modules/agent-search/components/AgentResults';
import { AgentSortMenu } from '@/modules/agent-search/components/AgentSortMenu';
import { useAgentFilterChips } from '@/modules/agent-search/hooks/use-agent-filter-chips';
import { storeToRequest } from '@/modules/agent-search/lib/store-to-request';
import { useAgentSearchQuery } from '@/modules/agent-search/queries/use-agent-search.query';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import { SearchAppliedChips, SearchToolbar } from '@/modules/search-shared';

// The agents workspace is the SAME frame as the schools workspace with the map track
// absent: the design's filter bar over a full-width result list, height-locked so
// only the list scrolls. Filters live in the shared §8.6 overlay at every width.
function AgentsPane() {
  const t = useTranslations('AgentSearch');
  const q = useAgentSearchStore((s) => s.q);
  const countriesServed = useAgentSearchStore((s) => s.countriesServed);
  const languages = useAgentSearchStore((s) => s.languages);
  const services = useAgentSearchStore((s) => s.services);
  const sort = useAgentSearchStore((s) => s.sort);
  const page = useAgentSearchStore((s) => s.page);
  const setPage = useAgentSearchStore((s) => s.setPage);
  const reset = useAgentSearchStore((s) => s.reset);
  const chips = useAgentFilterChips();

  const request = useMemo(
    () => storeToRequest({ q, countriesServed, languages, services, sort, page }),
    [q, countriesServed, languages, services, sort, page],
  );
  const query = useAgentSearchQuery(request);
  const activeFilterCount = countriesServed.length + languages.length + services.length;
  const total = query.data?.meta.pagination.total ?? 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:h-full">
      <SearchToolbar
        count={t('resultsCount', { count: total })}
        filters={<AgentFiltersDialog activeCount={activeFilterCount} resultCount={total} />}
        chips={
          <SearchAppliedChips
            chips={chips}
            emptyLabel={t('filterPanel.noFilters')}
            removeLabel={(label) => t('filterPanel.remove', { label })}
          />
        }
        actions={<AgentSortMenu />}
      />
      <div
        data-slot="agent-search-workspace"
        className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full"
      >
        <AgentResults
          query={query}
          onRetry={() => void query.refetch()}
          onReset={reset}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

export { AgentsPane };
