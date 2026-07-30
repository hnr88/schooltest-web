import type { SchoolChildFormValues } from '@/modules/school-children/schemas/school-child.schema';
import type { ChildWriteBody } from '@/modules/school-children/types/school-children.types';

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
function optionalEntries(values: SchoolChildFormValues): ChildWriteBody {
  return {
    family_name: values.family_name === '' ? null : values.family_name,
    date_of_birth: values.date_of_birth === '' ? null : values.date_of_birth,
    year_level: values.year_level === '' ? null : Number(values.year_level),
    first_language: values.first_language === '' ? null : values.first_language,
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
// simply left out — the child starts unassigned.
export function buildChildCreateBody(values: SchoolChildFormValues): ChildWriteBody {
  const body: ChildWriteBody = { given_name: values.given_name };
  const optional = optionalEntries(values);
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null) {
      (body as Record<string, unknown>)[key] = value;
    }
  }
  return body;
}

// C-CHD-03: partial write of changed fields only. A cleared field the admin
// touched sends null (the server's "clear it"), an untouched field sends
// nothing (the server's "keep it").
export function buildChildUpdateBody(
  values: SchoolChildFormValues,
  dirtyFields: Partial<Record<keyof SchoolChildFormValues, boolean>>,
): ChildWriteBody {
  const body: ChildWriteBody = {};
  if (dirtyFields.given_name) {
    body.given_name = values.given_name;
  }
  const optional = optionalEntries(values);
  for (const [key, value] of Object.entries(optional)) {
    if (dirtyFields[key as keyof SchoolChildFormValues]) {
      (body as Record<string, unknown>)[key] = value;
    }
  }
  return body;
}
