import type {
  FieldProvenance,
  SchoolOnboardingPayload,
} from '@/modules/school-onboarding/types/school-onboarding.types';

export const ONBOARDING_STEP_KEYS = ['school', 'teachers', 'review', 'admin'] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_KEYS.length;

// Contract enums (schooltest-api onboarding-complete.ts): state and sector are
// validated against these lists when the final payload patches the school.
export const AU_STATE_VALUES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const;

export const SCHOOL_SECTOR_VALUES = ['government', 'non-government', 'catholic'] as const;

export const TEACHER_ROLE_VALUES = ['teacher', 'school_admin'] as const;

export const PASSWORD_MIN_LENGTH = 8;

export const POSTCODE_PATTERN = /^\d{4}$/;

// Zustand persist key: one wizard per onboarding token.
export const STORAGE_KEY_PREFIX = 'school-onboarding.';

export const EMPTY_PAYLOAD: SchoolOnboardingPayload = {
  school: { name: '', suburb: '', state: '', postcode: '', sector: '' },
  teachers: [],
  admin: { first_name: '', last_name: '', email: '' },
};

// Manual entry marks everything confirmed (D-3: the suggested/confirmed model
// exists from the start; AI prefill ships later).
export const MANUAL_CONFIRMED: FieldProvenance = { source: 'manual', state: 'confirmed' };

// Prefilled values from the ops-entered school record start as suggestions the
// school confirms at the school-details step.
export const MANUAL_SUGGESTED: FieldProvenance = { source: 'manual', state: 'suggested' };

export const SCHOOL_FIELD_KEYS = ['name', 'suburb', 'state', 'postcode', 'sector'] as const;
