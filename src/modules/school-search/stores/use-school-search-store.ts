import { create } from 'zustand';

import {
  DEFAULT_SORT_BY,
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
  PAGE_SIZE,
} from '@/modules/school-search/constants/school-search.constants';
import type {
  SchoolSearchFilters,
  SchoolTypeValue,
  SectorValue,
  SortBy,
  StateCode,
} from '@/modules/school-search/types/school-search.types';

// The saved search-preferences subset this store hydrates from (D-SEARCH-PREF).
export interface SchoolSearchDefaults {
  states: StateCode[];
  sortBy: SortBy;
  pageSize: number;
}

interface SchoolSearchStore extends SchoolSearchFilters {
  pageSize: number;
  // The defaults the last hydration applied — kept so `reset()` returns to the
  // SAVED defaults instead of the blank INITIAL. Null until the first hydration.
  savedDefaults: SchoolSearchDefaults | null;
  // True once saved defaults have been seeded this session — a remount must never
  // re-seed over the user's own choices.
  hasHydratedDefaults: boolean;
  // Transient map state — NOT part of SchoolSearchFilters so it never reaches
  // `storeToRequest` and never triggers a refetch. In-memory, resets on reload.
  activeSchoolId: string | null;
  // The CHOSEN school (a click), as distinct from `activeSchoolId` (a hover): it
  // drives the map camera, the navy pin and the floating map card (spec 01 §8.4/§8.5).
  selectedSchoolId: string | null;
  isMapOpen: boolean;
  setQ: (q: string) => void;
  // The canonical multi-select control (ChoicePillGroup) emits the WHOLE next
  // selection, so these replace the previous one-value toggle actions.
  setStates: (states: readonly string[]) => void;
  setSectors: (sectors: readonly string[]) => void;
  setSchoolTypes: (schoolTypes: readonly string[]) => void;
  setToggles: (keys: readonly string[]) => void;
  setFeeRange: (feeMin: number, feeMax: number) => void;
  setSort: (sortBy: SortBy) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  hydrateDefaults: (defaults: SchoolSearchDefaults) => void;
  setActiveSchoolId: (id: string | null) => void;
  setSelectedSchoolId: (id: string | null) => void;
  toggleMap: () => void;
  clearFilters: () => void;
  reset: () => void;
}

const INITIAL: SchoolSearchFilters = {
  q: '',
  states: [],
  schoolTypes: [],
  sectors: [],
  levels: [],
  atarAvailable: false,
  elicos: false,
  scholarshipAvailable: false,
  feeMin: FEE_MIN_BOUND,
  feeMax: FEE_MAX_BOUND,
  sortBy: DEFAULT_SORT_BY,
  page: 1,
};

// In-memory only (legacy model): resets on reload, no persist middleware, no localStorage.
// Every filter mutation resets `page` to 1 so results re-page from the top.
export const useSchoolSearchStore = create<SchoolSearchStore>((set) => ({
  ...INITIAL,
  pageSize: PAGE_SIZE,
  savedDefaults: null,
  hasHydratedDefaults: false,
  activeSchoolId: null,
  selectedSchoolId: null,
  isMapOpen: false,
  setQ: (q) => set({ q, page: 1 }),
  setStates: (states) => set({ states: [...states] as StateCode[], page: 1 }),
  setSectors: (sectors) => set({ sectors: [...sectors] as SectorValue[], page: 1 }),
  setSchoolTypes: (schoolTypes) =>
    set({ schoolTypes: [...schoolTypes] as SchoolTypeValue[], page: 1 }),
  setToggles: (keys) =>
    set({
      scholarshipAvailable: keys.includes('scholarshipAvailable'),
      atarAvailable: keys.includes('atarAvailable'),
      elicos: keys.includes('elicos'),
      page: 1,
    }),
  setFeeRange: (feeMin, feeMax) => set({ feeMin, feeMax, page: 1 }),
  setSort: (sortBy) => set({ sortBy, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  // Seeds the saved search defaults ONCE per session, per field ONLY while the
  // user has not touched that field — a choice made before the preferences
  // response lands always wins.
  hydrateDefaults: (defaults) =>
    set((current) => {
      if (current.hasHydratedDefaults) return {};
      return {
        hasHydratedDefaults: true,
        savedDefaults: defaults,
        states: current.states.length > 0 ? current.states : defaults.states,
        sortBy: current.sortBy !== DEFAULT_SORT_BY ? current.sortBy : defaults.sortBy,
        pageSize: current.pageSize !== PAGE_SIZE ? current.pageSize : defaults.pageSize,
        page: 1,
      };
    }),
  // Pure hover/focus highlight state — MUST NOT reset `page` (would refetch).
  setActiveSchoolId: (id) => set({ activeSchoolId: id }),
  // Same contract as `activeSchoolId`: a pure view concern, so it MUST NOT reset
  // `page` (that would refetch the corpus on every card click).
  setSelectedSchoolId: (id) => set({ selectedSchoolId: id }),
  toggleMap: () => set((current) => ({ isMapOpen: !current.isMapOpen })),
  clearFilters: () =>
    set((current) => ({
      ...INITIAL,
      q: current.q,
      isMapOpen: current.isMapOpen,
    })),
  // Reset returns to the SAVED defaults (not blank) once they are known; the
  // hydration flags survive so the pane does not re-seed afterwards.
  reset: () =>
    set((current) => ({
      ...INITIAL,
      states: current.savedDefaults?.states ?? INITIAL.states,
      sortBy: current.savedDefaults?.sortBy ?? INITIAL.sortBy,
      pageSize: current.savedDefaults?.pageSize ?? PAGE_SIZE,
      savedDefaults: current.savedDefaults,
      hasHydratedDefaults: current.hasHydratedDefaults,
      selectedSchoolId: null,
      activeSchoolId: null,
    })),
}));
