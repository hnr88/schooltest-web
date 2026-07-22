import { create } from 'zustand';

import {
  DEFAULT_SORT_BY,
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
} from '@/modules/school-search/constants/school-search.constants';
import type {
  SchoolSearchFilters,
  SchoolTypeValue,
  SectorValue,
  SortBy,
  StateCode,
} from '@/modules/school-search/types/school-search.types';

interface SchoolSearchStore extends SchoolSearchFilters {
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
  activeSchoolId: null,
  selectedSchoolId: null,
  isMapOpen: true,
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
  reset: () => set({ ...INITIAL, selectedSchoolId: null, activeSchoolId: null }),
}));
