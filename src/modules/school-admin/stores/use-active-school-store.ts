'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  getActiveSchoolDocumentId,
  setActiveSchoolDocumentId,
} from '@/lib/axios/active-school';
import { onAuthChange } from '@/lib/axios/strapi';

interface ActiveSchoolState {
  /** The documentId the rail switcher picked; null = legacy primary school. */
  activeSchoolDocumentId: string | null;
  setActiveSchool: (documentId: string) => void;
  clearActiveSchool: () => void;
}

// Multi-tenant school switcher state. The axios boundary reads the holder (in
// `lib/axios/active-school.ts`, not this module — importing the store there
// would be a cycle), so the header survives wherever React has never
// rendered; this store mirrors it for React and persists it across reloads.
// The holder is written FIRST in every mutator: a render-free caller (an
// axios interceptor mid-refetch) must never see a torn state.
export const useActiveSchoolStore = create<ActiveSchoolState>()(
  persist(
    (set) => ({
      activeSchoolDocumentId: getActiveSchoolDocumentId(),
      setActiveSchool: (documentId) => {
        setActiveSchoolDocumentId(documentId);
        set({ activeSchoolDocumentId: documentId });
      },
      clearActiveSchool: () => {
        setActiveSchoolDocumentId(null);
        set({ activeSchoolDocumentId: null });
      },
    }),
    {
      name: 'school.activeSchoolDocumentId',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeSchoolDocumentId: state.activeSchoolDocumentId }),
      onRehydrateStorage: () => (state) => {
        // Rehydrate the holder from the persisted choice so deep links and
        // reloads scope their requests before the first React render.
        setActiveSchoolDocumentId(state?.activeSchoolDocumentId ?? null);
      },
    },
  ),
);

// GAP-6 symmetry: an auth change (sign-out, 401 invalidation, fresh sign-in)
// clears the pick — a teacher signing in after a school_admin must never
// inherit a stale school header. Module scope, exactly once.
onAuthChange(() => {
  setActiveSchoolDocumentId(null);
  useActiveSchoolStore.setState({ activeSchoolDocumentId: null });
});
