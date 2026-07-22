'use client';

import { useTranslations } from 'next-intl';

import { AgentFilterControls } from '@/modules/agent-search/components/AgentFilterControls';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import { SearchFiltersDialog } from '@/modules/search-shared';

// The agents pane gets the SAME §8.6 overlay as the schools pane — one page, one
// filter surface. The groups inside are unchanged canonical FilterRailSection +
// ChoicePillGroup controls, so the `services` enum the C10 network pin asserts still
// leaves this UI verbatim.
function AgentFiltersDialog({
  activeCount,
  resultCount,
}: {
  activeCount: number;
  resultCount: number;
}) {
  const t = useTranslations('AgentSearch');
  const clearFilters = useAgentSearchStore((state) => state.clearFilters);

  return (
    <SearchFiltersDialog
      triggerLabel={t('filterPanel.trigger')}
      title={t('filterPanel.title')}
      description={t('filterPanel.description')}
      activeCount={activeCount}
      countLabel={t('filterPanel.activeCount', { count: activeCount })}
      closeLabel={t('filterPanel.close')}
      clearLabel={t('filterPanel.clear')}
      applyLabel={t('filterPanel.apply', { count: resultCount })}
      onClear={clearFilters}
    >
      <div data-slot="agent-filter-panel" className="flex flex-col gap-2">
        <AgentFilterControls />
      </div>
    </SearchFiltersDialog>
  );
}

export { AgentFiltersDialog };
