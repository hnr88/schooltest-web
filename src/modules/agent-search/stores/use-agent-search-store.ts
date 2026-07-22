import { create } from 'zustand';

import { DEFAULT_SORT } from '@/modules/agent-search/constants/agent-search.constants';
import type {
  AgentSearchFilters,
  AgentServiceValue,
  AgentSortBy,
} from '@/modules/agent-search/types/agent-search.types';

interface AgentSearchStore extends AgentSearchFilters {
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

const INITIAL: AgentSearchFilters = {
  q: '',
  countriesServed: [],
  languages: [],
  services: [],
  sort: DEFAULT_SORT,
  page: 1,
};

// In-memory only (legacy model): resets on reload, no persist middleware, no localStorage.
// Every filter mutation resets `page` to 1; `reset()` clears `q` too — the shared
// UnifiedSearchBar reflects this store's `q`, so reset must blank it (085 dependency).
export const useAgentSearchStore = create<AgentSearchStore>((set) => ({
  ...INITIAL,
  setQ: (q) => set({ q, page: 1 }),
  setCountries: (countries) => set({ countriesServed: [...countries], page: 1 }),
  setLanguages: (languages) => set({ languages: [...languages], page: 1 }),
  setServices: (services) => set({ services: [...services] as AgentServiceValue[], page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  clearFilters: () =>
    set((current) => ({
      ...INITIAL,
      q: current.q,
    })),
  reset: () => set(INITIAL),
}));
