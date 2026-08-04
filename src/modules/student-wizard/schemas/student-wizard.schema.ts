import { z } from 'zod';

import { parentViewsEnabled } from '@/modules/flags';
import {
  activeWizardStepKeys,
  CONTACT_CHANNEL_VALUES,
  CURRENT_YEAR,
  CURRENT_YEAR_LEVEL_VALUES,
  DOB_MIN_YEAR,
  GENDER_VALUES,
  TARGET_YEAR_MAX_OFFSET,
  TARGET_YEAR_MIN,
  TERM_VALUES,
  WIZARD_STEP_KEYS,
} from '@/modules/student-wizard/constants/student-wizard.constants';

import type { StudentWizardSchema, WizardSchemaTranslator } from '@/modules/student-wizard/types/schemas.types';

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
  const requiredEmail = (requiredMessage: string) =>
    z.string().trim().min(1, requiredMessage).pipe(z.email(t('emailInvalid')));

  // Upload ids stay `number | null` on the form (RHF default + remove resets to
  // null) but must parse to a present id — null is the "not uploaded yet" state.
  const requiredUploadId = (requiredMessage: string) =>
    z
      .number()
      .int()
      .positive()
      .nullable()
      .refine((value): value is number => value !== null, { message: requiredMessage });

  // Task 47 (st-mvp-pivot): guardian/media steps are masked with the parent
  // portal, so their fields must not gate submit while hidden. The masked
  // variants keep the exact same wire types (string / number | null) and only
  // drop the required refinements — flag ON parses with the legacy rules.
  const masked = !parentViewsEnabled();

  return z.object({
    // Step 1 — Personal
    // Every field the wizard renders is mandatory (parent requirement), so the
    // per-field rules 1:1 the server whitelist's required set.
    given_name: z.string().trim().min(1, t('givenNameRequired')).max(100, t('givenNameTooLong')),
    family_name: z
      .string()
      .trim()
      .min(1, t('familyNameRequired'))
      .max(100, t('familyNameTooLong')),
    email: requiredEmail(t('emailRequired')),
    date_of_birth: z
      .string()
      .min(1, t('dobRequired'))
      .refine(isValidDateOfBirth, t('dobInvalid')),
    gender: z.enum(GENDER_VALUES, { error: t('genderRequired') }),
    nationality: z
      .string()
      .trim()
      .min(1, t('nationalityRequired'))
      .max(100, t('nationalityTooLong')),
    passport_number: z
      .string()
      .trim()
      .min(1, t('passportRequired'))
      .max(50, t('passportTooLong')),
    // Step 2 — Education
    current_school: z
      .string()
      .trim()
      .min(1, t('currentSchoolRequired'))
      .max(255, t('currentSchoolTooLong')),
    current_year_level: z.enum(CURRENT_YEAR_LEVEL_VALUES, {
      error: t('currentYearLevelRequired'),
    }),
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
    parent_guardian_name: masked
      ? z.string().trim().max(200, t('guardianNameTooLong'))
      : z.string().trim().min(1, t('guardianNameRequired')).max(200, t('guardianNameTooLong')),
    parent_guardian_phone: masked
      ? z.string().trim().max(50, t('guardianPhoneTooLong'))
      : z.string().trim().min(1, t('guardianPhoneRequired')).max(50, t('guardianPhoneTooLong')),
    parent_guardian_email: masked
      ? z.string().trim().max(255)
      : requiredEmail(t('guardianEmailRequired')),
    parent_guardian_wechat: z.string().trim().max(100, t('wechatTooLong')).optional(),
    preferred_contact_channel: z.enum(CONTACT_CHANNEL_VALUES).default('whatsapp'),
    // Step 4 — Media (upload file ids from C-UPLOAD-PARENT): both uploads are
    // mandatory — a missing id (null) fails the step with the required message.
    photo: masked ? z.number().int().positive().nullable() : requiredUploadId(t('photoRequired')),
    voice_intro: masked
      ? z.number().int().positive().nullable()
      : requiredUploadId(t('voiceIntroRequired')),
  });
}
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

// Task 47: STEP_FIELDS indexed by the ACTIVE step list — masked mode drops the
// guardian/media entries so step gates and error redirects track the rendered
// steps. Flag ON returns the same five entries as STEP_FIELDS.
export function activeStepFields(): readonly (readonly (keyof StudentWizardValues)[])[] {
  return activeWizardStepKeys().map((key) => STEP_FIELDS[WIZARD_STEP_KEYS.indexOf(key)]);
}
