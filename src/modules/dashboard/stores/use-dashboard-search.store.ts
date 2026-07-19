import { create } from 'zustand';

interface DashboardSearchState {
  query: string;
  selectedStudentId: string | null;
  setQuery: (query: string) => void;
  selectStudent: (documentId: string) => void;
  clear: () => void;
}

const INITIAL_STATE = { query: '', selectedStudentId: null as string | null };

// Dashboard search bar state (task 18, D8): `query` is the raw input value
// DashboardSearch binds to; `selectedStudentId` is the result the parent
// clicked, which StudentsSection reads to filter its table. `clear()` resets
// both together so the "Clear" action returns to the unfiltered list.
export const useDashboardSearchStore = create<DashboardSearchState>((set) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  selectStudent: (documentId) => set({ selectedStudentId: documentId }),
  clear: () => set(INITIAL_STATE),
}));
