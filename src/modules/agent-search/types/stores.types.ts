import type { AgentSearchFilters, AgentSortBy } from '@/modules/agent-search/types/agent-search.types';

export interface AgentSearchStore extends AgentSearchFilters {
  setQ: (q: string) => void;
  // The canonical multi-select control (ChoicePillGroup) emits the WHOLE next
  // selection, so these replace the previous one-value toggle actions.
  setCountries: (countries: readonly string[]) => void;
  setLanguages: (languages: readonly string[]) => void;
  setServices: (services: readonly string[]) => void;
  setSort: (sort: AgentSortBy) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  reset: () => void;
}
