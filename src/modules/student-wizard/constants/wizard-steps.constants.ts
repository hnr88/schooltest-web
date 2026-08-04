import type { StudentWizardValues } from '@/modules/student-wizard/schemas/student-wizard.schema';

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
