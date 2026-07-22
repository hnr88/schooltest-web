import type { FieldErrors } from 'react-hook-form';

import { STEP_FIELDS } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// The rail is free navigation (spec 03 §2.2: "every step is directly clickable"),
// so a parent can reach step 5 with an earlier step still incomplete. When the
// full-schema parse then rejects, this maps the first errored field back to the
// step that owns it — without it the submit would fail silently on a screen that
// shows none of the offending fields. Returns null when nothing matches.
export function firstInvalidStep(errors: FieldErrors<StudentWizardValues>): number | null {
  const invalid = Object.keys(errors);
  if (invalid.length === 0) {
    return null;
  }
  const index = STEP_FIELDS.findIndex((fields) =>
    fields.some((field) => invalid.includes(field)),
  );
  return index === -1 ? null : index;
}
