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
  ToggleKey,
} from '@/modules/school-search/types/school-search.types';

interface SchoolSearchStore extends SchoolSearchFilters {
  setQ: (q: string) => void;
  toggleState: (state: StateCode) => void;
  toggleSector: (sector: SectorValue) => void;
  toggleSchoolType: (schoolType: SchoolTypeValue) => void;
  setToggle: (key: ToggleKey, value: boolean) => void;
  setFeeRange: (feeMin: number, feeMax: number) => void;
  setSort: (sortBy: SortBy) => void;
  setPage: (page: number) => void;
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

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

// In-memory only (legacy model): resets on reload, no persist middleware, no localStorage.
// Every filter mutation resets `page` to 1 so results re-page from the top.
export const useSchoolSearchStore = create<SchoolSearchStore>((set) => ({
  ...INITIAL,
  setQ: (q) => set({ q, page: 1 }),
  toggleState: (state) =>
    set((current) => ({ states: toggleValue(current.states, state), page: 1 })),
  toggleSector: (sector) =>
    set((current) => ({ sectors: toggleValue(current.sectors, sector), page: 1 })),
  toggleSchoolType: (schoolType) =>
    set((current) => ({
      schoolTypes: toggleValue(current.schoolTypes, schoolType),
      page: 1,
    })),
  setToggle: (key, value) =>
    set(() => ({ [key]: value, page: 1 }) as Partial<SchoolSearchStore>),
  setFeeRange: (feeMin, feeMax) => set({ feeMin, feeMax, page: 1 }),
  setSort: (sortBy) => set({ sortBy, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(INITIAL),
}));
