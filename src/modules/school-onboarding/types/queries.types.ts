import type { ProvenanceMap, SchoolOnboardingPayload, TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';

export interface CompleteOnboardingInput {
  token: string;
  payload: SchoolOnboardingPayload;
  provenance: ProvenanceMap;
  admin: { first_name: string; last_name: string; email: string; password: string };
  teachers: TeacherEntry[];
}

export interface SaveProgressInput {
  token: string;
  current_step: number;
  payload: SchoolOnboardingPayload;
  provenance: ProvenanceMap;
}
