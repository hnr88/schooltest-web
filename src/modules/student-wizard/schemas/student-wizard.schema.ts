import { z } from 'zod';

import {
  CONTACT_CHANNEL_VALUES,
  CURRENT_YEAR,
  CURRENT_YEAR_LEVEL_VALUES,
  DOB_MIN_YEAR,
  GENDER_VALUES,
  TARGET_YEAR_MAX_OFFSET,
  TARGET_YEAR_MIN,
  TERM_VALUES,
} from '@/modules/student-wizard/constants/student-wizard.constants';

// Baked-message factory: messages are resolved up-front from the
// `StudentWizardSchema` namespace, so `errors.<field>.message` is already
// localized when steps 049–052 render it (no per-field `t()` wrapping).
// No message augmentation exists, so next-intl's `t` accepts string keys and is
// assignable to this structural type.
type WizardSchemaTranslator = (key: string) => string;

function isValidDateOfBirth(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  if (Number(value.slice(0, 4)) < DOB_MIN_YEAR) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() <= today.getTime();
}

function isValidTargetYear(value: string): boolean {
  if (!/^\d{4}$/.test(value)) {
    return false;
  }
  const year = Number(value);
  return year >= TARGET_YEAR_MIN && year <= CURRENT_YEAR + TARGET_YEAR_MAX_OFFSET;
}

// C-UI-STUDENT-WIZARD / C-STUDENT-CREATE — the per-step field rules 1:1 with the
// server whitelist. NEVER includes parent/status/student_key/teacher/class/user.
export function createStudentWizardSchema(t: WizardSchemaTranslator) {
  const optionalEmail = z
    .union([z.literal(''), z.string().trim().pipe(z.email(t('emailInvalid')))])
    .optional();

  return z.object({
    // Step 1 — Personal
    given_name: z.string().trim().min(1, t('givenNameRequired')).max(100, t('givenNameTooLong')),
    family_name: z
      .string()
      .trim()
      .min(1, t('familyNameRequired'))
      .max(100, t('familyNameTooLong')),
    email: optionalEmail,
    date_of_birth: z
      .string()
      .refine((value) => value === '' || isValidDateOfBirth(value), t('dobInvalid'))
      .optional(),
    gender: z.enum(GENDER_VALUES).optional(),
    nationality: z
      .string()
      .trim()
      .min(1, t('nationalityRequired'))
      .max(100, t('nationalityTooLong')),
    passport_number: z.string().trim().max(50, t('passportTooLong')).optional(),
    // Step 2 — Education
    current_school: z.string().trim().max(255, t('currentSchoolTooLong')).optional(),
    current_year_level: z.enum(CURRENT_YEAR_LEVEL_VALUES).optional(),
    year_level: z
      .number()
      .int()
      .min(7, t('yearLevelInvalid'))
      .max(12, t('yearLevelInvalid'))
      .nullable()
      .optional(),
    target_entry_year: z
      .string()
      .min(1, t('targetYearRequired'))
      .refine(isValidTargetYear, t('targetYearInvalid')),
    target_entry_term: z.enum(TERM_VALUES, { error: t('termRequired') }),
    // Step 3 — Guardian
    parent_guardian_name: z
      .string()
      .trim()
      .min(1, t('guardianNameRequired'))
      .max(200, t('guardianNameTooLong')),
    parent_guardian_phone: z
      .string()
      .trim()
      .min(1, t('guardianPhoneRequired'))
      .max(50, t('guardianPhoneTooLong')),
    parent_guardian_email: optionalEmail,
    parent_guardian_wechat: z.string().trim().max(100, t('wechatTooLong')).optional(),
    preferred_contact_channel: z.enum(CONTACT_CHANNEL_VALUES).default('whatsapp'),
    // Step 4 — Media (upload file ids from C-UPLOAD-PARENT)
    photo: z.number().int().positive().nullable().optional(),
    voice_intro: z.number().int().positive().nullable().optional(),
  });
}

export type StudentWizardSchema = ReturnType<typeof createStudentWizardSchema>;
export type StudentWizardValues = z.input<StudentWizardSchema>;
export type StudentWizardOutput = z.output<StudentWizardSchema>;

// Continue runs `form.trigger(STEP_FIELDS[step])`. Every schema field is mapped
// to exactly one of steps 1–4; step 5 (review) triggers a full-schema parse.
export const STEP_FIELDS = [
  ['given_name', 'family_name', 'email', 'date_of_birth', 'gender', 'nationality', 'passport_number'],
  ['current_school', 'current_year_level', 'year_level', 'target_entry_year', 'target_entry_term'],
  [
    'parent_guardian_name',
    'parent_guardian_phone',
    'parent_guardian_email',
    'parent_guardian_wechat',
    'preferred_contact_channel',
  ],
  ['photo', 'voice_intro'],
  [],
] as const satisfies readonly (readonly (keyof StudentWizardValues)[])[];
