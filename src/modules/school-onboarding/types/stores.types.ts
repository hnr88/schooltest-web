import type { createSchoolOnboardingStore } from '@/modules/school-onboarding/stores/use-school-onboarding-store';

import type { OnboardingProgressState } from '@/modules/school-onboarding/types/lib.types';
import type { AdminDetails, SchoolDetails, TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';

export interface SchoolOnboardingStoreState extends OnboardingProgressState {
  setStep: (step: number) => void;
  applyServerState: (state: OnboardingProgressState) => void;
  setSchool: (school: SchoolDetails) => void;
  setTeachers: (teachers: TeacherEntry[]) => void;
  setAdmin: (admin: AdminDetails) => void;
  reset: () => void;
}

export type SchoolOnboardingStore = ReturnType<typeof createSchoolOnboardingStore>;
