import { z } from 'zod';

import {
  AU_STATE_VALUES,
  PASSWORD_MIN_LENGTH,
  POSTCODE_PATTERN,
  SCHOOL_SECTOR_VALUES,
  TEACHER_ROLE_VALUES,
} from '@/modules/school-onboarding/constants/school-onboarding.constants';

import type { OnboardingSchemaTranslator } from '@/modules/school-onboarding/types/schemas.types';

// --- Server response schemas (C-ONB-01/02/03 data payloads) ---

export const schoolOnboardingResponseSchema = z.object({
  school: z.object({
    name: z.string(),
    suburb: z.string().nullable(),
    state: z.string().nullable(),
    postcode: z.string().nullable(),
    sector: z.string().nullable(),
  }),
  current_step: z.number().int().min(0),
  payload: z.record(z.string(), z.unknown()),
  provenance: z.record(
    z.string(),
    z.object({
      source: z.enum(['manual', 'ai']),
      state: z.enum(['suggested', 'confirmed']),
    }),
  ),
  // C-ONB-01 (v2), mission st-ops-onboarding: null means the magic link never
  // expires — it stays valid until it is used or the invitation is revoked.
  expires_at: z.string().nullable(),
});

export const saveProgressResponseSchema = z.object({
  current_step: z.number().int().min(0),
  saved_at: z.string(),
});

export const completeOnboardingResponseSchema = z.object({
  jwt: z.string().min(1),
  user: z.object({
    documentId: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.string(),
  }),
});

// --- Stored payload schema: rehydrates localStorage / server progress bodies
// defensively (`.catch` falls back to blanks, so a stale shape never crashes
// the wizard). ---

export const storedPayloadSchema = z.object({
  school: z
    .object({
      name: z.string().catch(''),
      suburb: z.string().catch(''),
      state: z.string().catch(''),
      postcode: z.string().catch(''),
      sector: z.string().catch(''),
    })
    .catch({ name: '', suburb: '', state: '', postcode: '', sector: '' }),
  teachers: z
    .array(
      z.object({
        first_name: z.string().catch(''),
        last_name: z.string().catch(''),
        email: z.string().catch(''),
        role: z.enum(TEACHER_ROLE_VALUES).catch('teacher'),
      }),
    )
    .catch([]),
  admin: z
    .object({
      first_name: z.string().catch(''),
      last_name: z.string().catch(''),
      email: z.string().catch(''),
    })
    .catch({ first_name: '', last_name: '', email: '' }),
});

// --- Per-step form schemas (client mirror of the C-ONB-03 validation) ---

export function createSchoolDetailsSchema(t: OnboardingSchemaTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('required')).max(200, t('tooLong')),
    suburb: z.string().trim().min(1, t('required')).max(120, t('tooLong')),
    state: z.string().min(1, t('required')).pipe(z.enum(AU_STATE_VALUES)),
    postcode: z.string().trim().regex(POSTCODE_PATTERN, t('postcodeInvalid')),
    sector: z.string().min(1, t('required')).pipe(z.enum(SCHOOL_SECTOR_VALUES)),
  });
}

export function createTeachersSchema(t: OnboardingSchemaTranslator) {
  return z.object({
    // Zero teachers is valid: the school can invite teachers after setup
    // (spec section 5 ordering).
    teachers: z.array(
      z.object({
        first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
        last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
        email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
        role: z.enum(TEACHER_ROLE_VALUES, { error: t('required') }),
      }),
    ),
  });
}

export function createAdminAccountSchema(t: OnboardingSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
    password: z.string().min(PASSWORD_MIN_LENGTH, t('passwordTooShort')).max(100, t('tooLong')),
  });
}

export type SchoolDetailsValues = z.infer<ReturnType<typeof createSchoolDetailsSchema>>;
export type TeachersValues = z.infer<ReturnType<typeof createTeachersSchema>>;
export type AdminAccountValues = z.infer<ReturnType<typeof createAdminAccountSchema>>;
