'use client';

import { useTranslations } from 'next-intl';

import {
  DEFAULT_SORT,
  SORT_OPTIONS,
} from '@/modules/agent-search/constants/agent-search.constants';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import type { AgentSortBy } from '@/modules/agent-search/types/agent-search.types';
import { SearchSortMenu } from '@/modules/search-shared';

// Binds the shared SearchSortMenu to the agents store — same control as the schools
// pane, bound to a different store.
function AgentSortMenu() {
  const t = useTranslations('AgentSearch');
  const sort = useAgentSearchStore((s) => s.sort);
  const setSort = useAgentSearchStore((s) => s.setSort);

  return (
    <SearchSortMenu
      label={t('sort.label')}
      value={sort}
      isDefault={sort === DEFAULT_SORT}
      onValueChange={(value) => setSort(value as AgentSortBy)}
      options={SORT_OPTIONS.map((option) => ({ value: option, label: t(`sortOptions.${option}`) }))}
    />
  );
}

export { AgentSortMenu };
