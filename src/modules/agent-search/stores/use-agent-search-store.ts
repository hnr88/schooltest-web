import { create } from 'zustand';

import { DEFAULT_SORT } from '@/modules/agent-search/constants/agent-search.constants';
import type {
  AgentSearchFilters,
  AgentServiceValue,
  AgentSortBy,
} from '@/modules/agent-search/types/agent-search.types';

interface AgentSearchStore extends AgentSearchFilters {
  setQ: (q: string) => void;
  toggleCountry: (country: string) => void;
  toggleLanguage: (language: string) => void;
  toggleService: (service: AgentServiceValue) => void;
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

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

// In-memory only (legacy model): resets on reload, no persist middleware, no localStorage.
// Every filter mutation resets `page` to 1; `reset()` clears `q` too — the shared
// UnifiedSearchBar reflects this store's `q`, so reset must blank it (085 dependency).
export const useAgentSearchStore = create<AgentSearchStore>((set) => ({
  ...INITIAL,
  setQ: (q) => set({ q, page: 1 }),
  toggleCountry: (country) =>
    set((current) => ({
      countriesServed: toggleValue(current.countriesServed, country),
      page: 1,
    })),
  toggleLanguage: (language) =>
    set((current) => ({
      languages: toggleValue(current.languages, language),
      page: 1,
    })),
  toggleService: (service) =>
    set((current) => ({
      services: toggleValue(current.services, service),
      page: 1,
    })),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  clearFilters: () =>
    set((current) => ({
      ...INITIAL,
      q: current.q,
    })),
  reset: () => set(INITIAL),
}));
