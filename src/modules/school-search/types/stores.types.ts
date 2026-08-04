import type { SchoolSearchFilters, SortBy, StateCode } from '@/modules/school-search/types/school-search.types';

export interface SchoolSearchDefaults {
  states: StateCode[];
  sortBy: SortBy;
  pageSize: number;
}

export interface SchoolSearchStore extends SchoolSearchFilters {
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
