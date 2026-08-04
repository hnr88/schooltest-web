import {
  EMPTY_PAYLOAD,
  MANUAL_SUGGESTED,
  ONBOARDING_STEP_COUNT,
  SCHOOL_FIELD_KEYS,
} from '@/modules/school-onboarding/constants/school-onboarding.constants';
import { storedPayloadSchema } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type {
  ProvenanceMap,
  SchoolOnboardingData,
  SchoolOnboardingPayload,
} from '@/modules/school-onboarding/types/school-onboarding.types';

import type { OnboardingProgressState } from '@/modules/school-onboarding/types/lib.types';

function clampStep(step: number): number {
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(Math.trunc(step), ONBOARDING_STEP_COUNT - 1);
}

// First visit: the ops-entered school record prefills the school step as
// suggestions the school confirms (D-3 provenance model, manual entry only).
function prefillFromSchoolRecord(
  data: SchoolOnboardingData,
): OnboardingProgressState {
  const school = {
    name: data.school.name ?? '',
    suburb: data.school.suburb ?? '',
    state: data.school.state ?? '',
    postcode: data.school.postcode ?? '',
    sector: data.school.sector ?? '',
  };
  const provenance: ProvenanceMap = {};
  for (const key of SCHOOL_FIELD_KEYS) {
    if (school[key]) provenance[`school.${key}`] = { ...MANUAL_SUGGESTED };
  }
  return { step: 0, payload: { ...EMPTY_PAYLOAD, school }, provenance };
}

/**
 * Rehydrate vs server (task 18, step 3): the local copy wins only when it is
 * strictly newer (a later step was reached locally than the server last
 * saved); on ties the server state wins. An empty server payload means the
 * school has never saved progress, so the school record prefills step one.
 */
export function mergeOnboardingState(
  local: OnboardingProgressState,
  data: SchoolOnboardingData,
): OnboardingProgressState {
  const serverStep = clampStep(data.current_step);
  if (local.step > serverStep) {
    return { ...local, step: clampStep(local.step) };
  }
  if (Object.keys(data.payload).length === 0) {
    return prefillFromSchoolRecord(data);
  }
  return {
    step: serverStep,
    payload: storedPayloadSchema.parse(data.payload),
    provenance: data.provenance,
  };
}
