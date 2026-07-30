'use client';

import { useSyncExternalStore } from 'react';

import { getSchoolOnboardingStore } from '@/modules/school-onboarding/stores/use-school-onboarding-store';

// The persisted wizard store hydrates from localStorage on the client only;
// the wizard must not render (or merge server state) before that lands.
export function useStoreHydration(token: string): boolean {
  const store = getSchoolOnboardingStore(token);
  return useSyncExternalStore(
    (onStoreChange) => store.persist.onFinishHydration(onStoreChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
