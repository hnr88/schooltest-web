import type { SchoolStudentFormValues } from '@/modules/school-students/schemas/school-student.schema';
import type { StudentWriteBody } from '@/modules/school-students/types/school-students.types';

// Form -> C-CHD-02/03 body coercion. The server runs a strict allowlist, so
// only contract keys are ever emitted: blank optional fields are omitted on
// create, and an edit sends ONLY the fields the admin actually changed (the
// list projection has no dob/year_level/EAL/D values to prefill, so a blank
// edit field means "keep the current value", never "clear it").

function parseLanguages(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

function triState(value: string): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

// Every optional field as [form key -> body entry] when the form value is set;
// '' produces the null/omitted marker the caller decides on.
function optionalEntries(values: SchoolStudentFormValues): StudentWriteBody {
  return {
    family_name: values.family_name === '' ? null : values.family_name,
    email: values.email === '' ? null : values.email,
    date_of_birth: values.date_of_birth === '' ? null : values.date_of_birth,
    year_level: values.year_level === '' ? null : Number(values.year_level),
    first_language: values.first_language === '' ? null : values.first_language,
    acara_phase: values.acara_phase === '' ? null : values.acara_phase,
    other_languages:
      values.other_languages === '' ? null : parseLanguages(values.other_languages),
    l1_literate: values.l1_literate === '' ? null : triState(values.l1_literate),
    time_learning_english_yrs:
      values.time_learning_english_yrs === '' ? null : Number(values.time_learning_english_yrs),
    time_in_australia_months:
      values.time_in_australia_months === '' ? null : Number(values.time_in_australia_months),
    prior_schooling_interrupted:
      values.prior_schooling_interrupted === ''
        ? null
        : triState(values.prior_schooling_interrupted),
    class_documentId: values.class_documentId === '' ? null : values.class_documentId,
  };
}

// C-CHD-02: given_name always; optional keys only when the admin entered a
// value (a blank stays server-null by omission). An empty class selection is
// simply left out — the student starts unassigned.
export function buildStudentCreateBody(values: SchoolStudentFormValues): StudentWriteBody {
  const body: StudentWriteBody = { given_name: values.given_name };
  const optional = optionalEntries(values);
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null) {
      (body as Record<string, unknown>)[key] = value;
    }
  }
  return body;
}

// C-CHD-03: partial write of the fields whose value differs from the form's
// initial values. A cleared field the admin changed sends null (the server's
// "clear it"), an untouched field sends nothing (the server's "keep it").
// Diffed against the initial values rather than RHF dirtyFields: inside the
// base-ui edit dialog the dirty-field map comes back empty even when values
// changed, which silently dropped every edit.
export function buildStudentUpdateBody(
  values: SchoolStudentFormValues,
  initial: SchoolStudentFormValues,
): StudentWriteBody {
  const body: StudentWriteBody = {};
  if (values.given_name !== initial.given_name) {
    body.given_name = values.given_name;
  }
  const optional = optionalEntries(values);
  const baseline = optionalEntries(initial);
  for (const [key, value] of Object.entries(optional)) {
    if (JSON.stringify(value) !== JSON.stringify(baseline[key as keyof StudentWriteBody])) {
      (body as Record<string, unknown>)[key] = value;
    }
  }
  return body;
}
