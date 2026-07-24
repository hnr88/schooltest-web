import type { FieldErrors } from 'react-hook-form';

import { STEP_FIELDS } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// Navigation is gated, but a full-schema parse can still reject a step the
// parent is no longer on (edit mode starts with every step reachable, and a
// revisited step can be broken after the fact). When the parse then rejects,
// this maps the first errored field back to the step that owns it — without it
// the submit would fail silently on a screen that shows none of the offending
// fields. Returns null when nothing matches.
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
