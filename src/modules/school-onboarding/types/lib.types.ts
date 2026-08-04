import type { ProvenanceMap, SchoolOnboardingPayload } from '@/modules/school-onboarding/types/school-onboarding.types';

export interface GoneErrorBody {
  error?: { details?: { reason?: string } };
}

export interface OnboardingProgressState {
  step: number;
  payload: SchoolOnboardingPayload;
  provenance: ProvenanceMap;
}
