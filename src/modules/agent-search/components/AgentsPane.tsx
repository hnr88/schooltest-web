'use client';

import { useMemo } from 'react';

import { AgentFilterPanel } from '@/modules/agent-search/components/AgentFilterPanel';
import { AgentResultsGrid } from '@/modules/agent-search/components/AgentResultsGrid';
import { AgentSortChip } from '@/modules/agent-search/components/AgentSortChip';
import { storeToRequest } from '@/modules/agent-search/lib/store-to-request';
import { useAgentSearchQuery } from '@/modules/agent-search/queries/use-agent-search.query';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';

// C-UI-SEARCH-AGENTS (Pattern A): everything rendered when mode==='agents' BELOW
// the unified heading + §5.4 search bar (both owned by C-UI-SEARCH-UNIFIED / 038).
// This pane renders from the §13.1 chip row down and is driven entirely by the 036
// store through `storeToRequest` into the TanStack query. No heading, no input.
function AgentsPane() {
  const q = useAgentSearchStore((s) => s.q);
  const countriesServed = useAgentSearchStore((s) => s.countriesServed);
  const languages = useAgentSearchStore((s) => s.languages);
  const services = useAgentSearchStore((s) => s.services);
  const sort = useAgentSearchStore((s) => s.sort);
  const page = useAgentSearchStore((s) => s.page);
  const setPage = useAgentSearchStore((s) => s.setPage);
  const reset = useAgentSearchStore((s) => s.reset);

  const request = useMemo(
    () => storeToRequest({ q, countriesServed, languages, services, sort, page }),
    [q, countriesServed, languages, services, sort, page],
  );

  const query = useAgentSearchQuery(request);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <AgentFilterPanel />
        <AgentSortChip />
      </div>
      <AgentResultsGrid
        query={query}
        onRetry={() => void query.refetch()}
        onReset={reset}
        onPageChange={setPage}
      />
    </div>
  );
}

export { AgentsPane };
