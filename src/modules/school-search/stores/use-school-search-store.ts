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
  // Per-field "the user chose this" flags for the three hydratable fields — set
  // ONLY by the explicit setters below, never by hydration. They are what lets a
  // LATER hydration (the user saved NEW defaults in settings mid-session) re-seed
  // exactly the fields the user has not touched while never clobbering a choice.
  defaultsTouched: { states: boolean; sortBy: boolean; pageSize: boolean };
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
