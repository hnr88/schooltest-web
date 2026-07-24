import type { StudentWizardOutput } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { StudentCreatePayload } from '@/modules/student-wizard/types/student-wizard.types';

// Trim, then keep only non-empty text (empty optionals are OMITTED, never `''`).
function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// C-STUDENT-CREATE / C-UI-STUDENT-WIZARD payload builder. Constructs the request
// body from the zod-parsed wizard output using ONLY the server whitelist keys —
// `parent`, `status`, `student_key`, `teacher`, `class`, `user` can never appear
// because they are never written here. Every field the wizard renders except
// `year_level`/`parent_guardian_wechat` is required by the schema, so only those
// two are omitted-when-empty; `photo`/`voice_intro` are the numeric upload id
// (the payload type keeps `| null` for the edit path's clear-media semantics).
export function buildStudentPayload(values: StudentWizardOutput): StudentCreatePayload {
  const payload: StudentCreatePayload = {
    given_name: values.given_name.trim(),
    family_name: values.family_name.trim(),
    email: values.email.trim(),
    date_of_birth: values.date_of_birth,
    gender: values.gender,
    nationality: values.nationality.trim(),
    passport_number: values.passport_number.trim(),
    current_school: values.current_school.trim(),
    current_year_level: values.current_year_level,
    target_entry_year: values.target_entry_year.trim(),
    target_entry_term: values.target_entry_term,
    parent_guardian_name: values.parent_guardian_name.trim(),
    parent_guardian_phone: values.parent_guardian_phone.trim(),
    parent_guardian_email: values.parent_guardian_email.trim(),
    preferred_contact_channel: values.preferred_contact_channel,
    photo: values.photo,
    voice_intro: values.voice_intro,
  };

  if (typeof values.year_level === 'number') payload.year_level = values.year_level;

  const guardianWechat = text(values.parent_guardian_wechat);
  if (guardianWechat) payload.parent_guardian_wechat = guardianWechat;

  return payload;
}
