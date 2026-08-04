'use client';

import { create, useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  EMPTY_PAYLOAD,
  MANUAL_CONFIRMED,
  SCHOOL_FIELD_KEYS,
  STORAGE_KEY_PREFIX,
} from '@/modules/school-onboarding/constants/school-onboarding.constants';
import type { OnboardingProgressState } from '@/modules/school-onboarding/types/lib.types';
import type {
  AdminDetails,
  ProvenanceMap,
  SchoolDetails,
  SchoolOnboardingPayload,
  TeacherEntry,
} from '@/modules/school-onboarding/types/school-onboarding.types';

import type { SchoolOnboardingStore, SchoolOnboardingStoreState } from '@/modules/school-onboarding/types/stores.types';

function confirmedMarks(keys: string[]): ProvenanceMap {
  const marks: ProvenanceMap = {};
  for (const key of keys) marks[key] = { ...MANUAL_CONFIRMED };
  return marks;
}

export function createSchoolOnboardingStore(token: string) {
  return create<SchoolOnboardingStoreState>()(
    persist(
      (set) => ({
        step: 0,
        payload: EMPTY_PAYLOAD,
        provenance: {},
        setStep: (step) => set({ step }),
        applyServerState: (state) =>
          set({ step: state.step, payload: state.payload, provenance: state.provenance }),
        // Completing a step is manual entry: every touched field flips to
        // { source: 'manual', state: 'confirmed' } (D-3).
        setSchool: (school) =>
          set((state) => ({
            payload: { ...state.payload, school: { ...school } },
            provenance: {
              ...state.provenance,
              ...confirmedMarks(SCHOOL_FIELD_KEYS.map((key) => `school.${key}`)),
            },
          })),
        setTeachers: (teachers) =>
          set((state) => ({
            payload: { ...state.payload, teachers: teachers.map((teacher) => ({ ...teacher })) },
            provenance: { ...state.provenance, ...confirmedMarks(['teachers']) },
          })),
        setAdmin: (admin) =>
          set((state) => ({
            payload: { ...state.payload, admin: { ...admin } },
            provenance: {
              ...state.provenance,
              ...confirmedMarks(['admin.first_name', 'admin.last_name', 'admin.email']),
            },
          })),
        reset: () => set({ step: 0, payload: EMPTY_PAYLOAD, provenance: {} }),
      }),
      {
        name: `${STORAGE_KEY_PREFIX}${token}`,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          step: state.step,
          payload: state.payload,
          provenance: state.provenance,
        }),
        version: 1,
      },
    ),
  );
}

// One persisted store per onboarding token (`school-onboarding.<token>`), so a
// school with several links never shares progress between them.
const stores = new Map<string, SchoolOnboardingStore>();

export function getSchoolOnboardingStore(token: string): SchoolOnboardingStore {
  const existing = stores.get(token);
  if (existing) return existing;
  const store = createSchoolOnboardingStore(token);
  stores.set(token, store);
  return store;
}

// After a successful completion the wizard store is dead: drop the memoised
// instance so a fresh visit (new token) never sees stale state.
export function destroySchoolOnboardingStore(token: string): void {
  stores.delete(token);
}

export function useSchoolOnboardingStore<T>(
  token: string,
  selector: (state: SchoolOnboardingStoreState) => T,
): T {
  return useStore(getSchoolOnboardingStore(token), selector);
}
