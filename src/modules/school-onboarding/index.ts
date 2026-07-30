export { SchoolOnboardingScreen } from './components/SchoolOnboardingScreen';
export { SchoolOnboardingWizard } from './components/SchoolOnboardingWizard';
export { OnboardingStatusScreen } from './components/OnboardingStatusScreen';
export { OnboardingStepper } from './components/OnboardingStepper';
export { SchoolDetailsStep } from './components/SchoolDetailsStep';
export { TeachersStep } from './components/TeachersStep';
export { ReviewStep } from './components/ReviewStep';
export { AdminAccountStep } from './components/AdminAccountStep';

export { useSchoolOnboardingQuery } from './queries/use-school-onboarding.query';
export { useSaveProgressMutation } from './mutations/use-save-progress.mutation';
export { useCompleteOnboardingMutation } from './mutations/use-complete-onboarding.mutation';

export { useOnboardingSteps } from './hooks/useOnboardingSteps';
export { useCompleteOnboarding } from './hooks/use-complete-onboarding';
export { useStoreHydration } from './hooks/use-store-hydration';

export { useSchoolOnboardingStore } from './stores/use-school-onboarding-store';
export { classifyLinkError } from './lib/classify-link-error';
export { mergeOnboardingState } from './lib/merge-onboarding-state';

export {
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_KEYS,
  STORAGE_KEY_PREFIX,
} from './constants/school-onboarding.constants';

export type {
  AdminDetails,
  CompleteOnboardingResult,
  FieldProvenance,
  OnboardingLinkState,
  OnboardingStepDefinition,
  OnboardingStepKey,
  ProvenanceMap,
  SaveProgressResult,
  SchoolDetails,
  SchoolOnboardingData,
  SchoolOnboardingPayload,
  TeacherEntry,
  TeacherRole,
} from './types/school-onboarding.types';
