import { parentViewsEnabled } from '@/modules/flags';
import type { StudentWizardOutput } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type {
  StudentCreateConsent,
  StudentCreatePayload,
  StudentCreatePayloadMasked,
} from '@/modules/student-wizard/types/student-wizard.types';

// Trim, then keep only non-empty text (empty optionals are OMITTED, never `''`).
function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// W4-19 (D5 S1/S4). Both default to what the values already say, so the create
// and update mutations (which pass no options) stay correct: a consent can only
// be ticked when the review step showed the block, i.e. records are enabled.
export interface BuildStudentPayloadOptions {
  /** `minimised_student_profile` is ON: `passport_number` is never sent. */
  minimised?: boolean;
  /** `false` never sends `consents` (the server answers 409 CONSENT_RECORDS_DISABLED). */
  recordsEnabled?: boolean;
}

// One grant per ticked box, in render order. Unticked sends nothing: declining
// is the absence of a record and never blocks enrolment.
function consentsFrom(
  values: StudentWizardOutput,
  opts: BuildStudentPayloadOptions,
): StudentCreateConsent[] | undefined {
  if (opts.recordsEnabled === false) return undefined;
  const consents: StudentCreateConsent[] = [];
  if (values.consent_data_collection) consents.push({ consent_type: 'data_collection' });
  if (values.consent_ai_processing) consents.push({ consent_type: 'ai_processing' });
  return consents.length > 0 ? consents : undefined;
}

// C-STUDENT-CREATE / C-UI-STUDENT-WIZARD payload builder. Constructs the request
// body from the zod-parsed wizard output using ONLY the server whitelist keys —
// `parent`, `status`, `student_key`, `teacher`, `class`, `user` can never appear
// because they are never written here. With today's required set (flags OFF)
// every field the wizard renders except `year_level`/`parent_guardian_wechat` is
// required by the schema, so those two are the only omit-when-empty keys;
// `photo`/`voice_intro` are the numeric upload id (the payload type keeps `| null`
// for the edit path's clear-media semantics).
//
// W4-19 minimised profile: passport_number is never sent, and gender,
// nationality, photo and voice intro are omitted when empty (the schema then
// allows it). Under today's required set those values are always present, so
// the key order and content of the payload are unchanged. `consents` is
// appended only when a box was ticked and records are enabled.
//
// Task 47 (st-mvp-pivot): with guardian/media steps masked the payload omits
// every guardian/media key entirely — C-CHD-02 400s on unknown fields, so an
// empty-string guardian key would break child creation, not just look untidy.
// (The server still requires them: reports/ground-privacy.md section 7. That
// inconsistency is left exactly as it was.)
export function buildStudentPayload(
  values: StudentWizardOutput,
  opts: BuildStudentPayloadOptions = {},
): StudentCreatePayload | StudentCreatePayloadMasked {
  const nationality = text(values.nationality);
  const passport = opts.minimised === true ? undefined : text(values.passport_number);
  const base = {
    given_name: values.given_name.trim(),
    family_name: values.family_name.trim(),
    email: values.email.trim(),
    date_of_birth: values.date_of_birth,
    ...(values.gender ? { gender: values.gender } : {}),
    ...(nationality ? { nationality } : {}),
    ...(passport ? { passport_number: passport } : {}),
    current_school: values.current_school.trim(),
    current_year_level: values.current_year_level,
    target_entry_year: values.target_entry_year.trim(),
    target_entry_term: values.target_entry_term,
  };
  const consents = consentsFrom(values, opts);

  if (!parentViewsEnabled()) {
    const payload: StudentCreatePayloadMasked = { ...base };
    if (typeof values.year_level === 'number') payload.year_level = values.year_level;
    if (consents) payload.consents = consents;
    return payload;
  }

  const payload: StudentCreatePayload = {
    ...base,
    parent_guardian_name: values.parent_guardian_name.trim(),
    parent_guardian_phone: values.parent_guardian_phone.trim(),
    parent_guardian_email: values.parent_guardian_email.trim(),
    preferred_contact_channel: values.preferred_contact_channel,
    ...(typeof values.photo === 'number' ? { photo: values.photo } : {}),
    ...(typeof values.voice_intro === 'number' ? { voice_intro: values.voice_intro } : {}),
  };

  if (typeof values.year_level === 'number') payload.year_level = values.year_level;

  const guardianWechat = text(values.parent_guardian_wechat);
  if (guardianWechat) payload.parent_guardian_wechat = guardianWechat;

  if (consents) payload.consents = consents;

  return payload;
}
