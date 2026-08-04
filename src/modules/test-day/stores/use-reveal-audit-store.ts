'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { REVEAL_AUDIT_STORAGE_KEY } from '@/modules/test-day/constants/test-day.constants';

import type { RevealAuditEntry, RevealAuditState } from '@/modules/test-day/types/stores.types';

// UI-only audit trail for C-SIT-05 (mvp-updates §4.5.3): no backend call, the
// entry is appended when the teacher opens the reveal dialog for a student and
// persists across reloads (persist + partialize keeps only the entries map;
// task 90's monitor states read this store to mark revealed students).
export const useRevealAuditStore = create<RevealAuditState>()(
  persist(
    (set) => ({
      entries: {},
      recordReveal: (sittingDocumentId, studentDocumentId) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [sittingDocumentId]: [
              ...(state.entries[sittingDocumentId] ?? []),
              { student_documentId: studentDocumentId, revealed_at: new Date().toISOString() },
            ],
          },
        })),
    }),
    {
      name: REVEAL_AUDIT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ entries: state.entries }),
      version: 1,
    },
  ),
);
