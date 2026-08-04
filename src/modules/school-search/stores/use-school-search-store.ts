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

import type { SchoolSearchDefaults, SchoolSearchStore } from '@/modules/school-search/types/stores.types';
import { INITIAL } from '@/modules/school-search/constants/stores.constants';

// In-memory only (legacy model): resets on reload, no persist middleware, no localStorage.
// Every filter mutation resets `page` to 1 so results re-page from the top.
export const useSchoolSearchStore = create<SchoolSearchStore>((set) => ({
  ...INITIAL,
  pageSize: PAGE_SIZE,
  savedDefaults: null,
  defaultsTouched: { states: false, sortBy: false, pageSize: false },
  activeSchoolId: null,
  selectedSchoolId: null,
  isMapOpen: false,
  setQ: (q) => set({ q, page: 1 }),
  setStates: (states) =>
    set((current) => ({
      states: [...states] as StateCode[],
      page: 1,
      defaultsTouched: { ...current.defaultsTouched, states: true },
    })),
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
  setSort: (sortBy) =>
    set((current) => ({
      sortBy,
      page: 1,
      defaultsTouched: { ...current.defaultsTouched, sortBy: true },
    })),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) =>
    set((current) => ({
      pageSize,
      page: 1,
      defaultsTouched: { ...current.defaultsTouched, pageSize: true },
    })),
  // Seeds the saved search defaults per field ONLY while the user has not touched
  // that field (defaultsTouched) — a choice made before the preferences response
  // lands always wins. NOT a one-shot: when the preferences CHANGE mid-session
  // (a new save in settings), the untouched fields re-seed to the new defaults
  // and `page` resets only if a seeded value actually changed.
  hydrateDefaults: (defaults) =>
    set((current) => {
      const states = current.defaultsTouched.states ? current.states : defaults.states;
      const sortBy = current.defaultsTouched.sortBy ? current.sortBy : defaults.sortBy;
      const pageSize = current.defaultsTouched.pageSize ? current.pageSize : defaults.pageSize;
      const changed =
        sortBy !== current.sortBy ||
        pageSize !== current.pageSize ||
        states.length !== current.states.length ||
        states.some((state, index) => state !== current.states[index]);
      return {
        savedDefaults: defaults,
        states,
        sortBy,
        pageSize,
        ...(changed ? { page: 1 } : {}),
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
      // Cleared fields are back to blank — treat them as never-touched again so
      // the saved defaults seed them on the next hydration, like a fresh mount.
      defaultsTouched: { ...current.defaultsTouched, states: false, sortBy: false },
    })),
  // Reset returns to the SAVED defaults (not blank) once they are known. The
  // values now ARE the defaults, so the touched flags clear too — a later
  // preferences change re-seeds them like any other untouched field.
  reset: () =>
    set((current) => ({
      ...INITIAL,
      states: current.savedDefaults?.states ?? INITIAL.states,
      sortBy: current.savedDefaults?.sortBy ?? INITIAL.sortBy,
      pageSize: current.savedDefaults?.pageSize ?? PAGE_SIZE,
      savedDefaults: current.savedDefaults,
      defaultsTouched: { states: false, sortBy: false, pageSize: false },
      selectedSchoolId: null,
      activeSchoolId: null,
    })),
}));
