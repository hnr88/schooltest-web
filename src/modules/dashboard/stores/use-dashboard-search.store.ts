import { create } from 'zustand';

import type { DashboardSearchState } from '@/modules/dashboard/types/stores.types';
import { INITIAL_STATE } from '@/modules/dashboard/constants/stores.constants';

// Dashboard search bar state (task 18, D8): `query` is the raw input value
// DashboardSearch binds to; `selectedStudentId` is the result the parent
// clicked, which the children list (use-children-list) reads to filter its
// table. `clear()` resets
// both together so the "Clear" action returns to the unfiltered list.
export const useDashboardSearchStore = create<DashboardSearchState>((set) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  selectStudent: (documentId) => set({ selectedStudentId: documentId }),
  clear: () => set(INITIAL_STATE),
}));
