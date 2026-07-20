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
// because they are never written here. Required strings are trimmed; optional
// strings are omitted when empty; `photo`/`voice_intro` are the numeric upload id
// or explicit `null` (legacy build-parent-student-payload precedent).
export function buildStudentPayload(values: StudentWizardOutput): StudentCreatePayload {
  const payload: StudentCreatePayload = {
    given_name: values.given_name.trim(),
    family_name: values.family_name.trim(),
    nationality: values.nationality.trim(),
    target_entry_year: values.target_entry_year.trim(),
    target_entry_term: values.target_entry_term,
    parent_guardian_name: values.parent_guardian_name.trim(),
    parent_guardian_phone: values.parent_guardian_phone.trim(),
    preferred_contact_channel: values.preferred_contact_channel,
    photo: values.photo ?? null,
    voice_intro: values.voice_intro ?? null,
  };

  const email = text(values.email);
  if (email) payload.email = email;

  const dateOfBirth = text(values.date_of_birth);
  if (dateOfBirth) payload.date_of_birth = dateOfBirth;

  if (values.gender) payload.gender = values.gender;

  const passportNumber = text(values.passport_number);
  if (passportNumber) payload.passport_number = passportNumber;

  const currentSchool = text(values.current_school);
  if (currentSchool) payload.current_school = currentSchool;

  if (values.current_year_level) payload.current_year_level = values.current_year_level;

  if (typeof values.year_level === 'number') payload.year_level = values.year_level;

  const guardianEmail = text(values.parent_guardian_email);
  if (guardianEmail) payload.parent_guardian_email = guardianEmail;

  const guardianWechat = text(values.parent_guardian_wechat);
  if (guardianWechat) payload.parent_guardian_wechat = guardianWechat;

  return payload;
}
