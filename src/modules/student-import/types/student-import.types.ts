import type { z } from 'zod';

import type {
  ConsentAttestationOptions,
  ConsentAttestationSelection,
} from '@/modules/privacy-consent';
import type { STUDENT_IMPORT_ALL_COLUMNS } from '@/modules/student-import/constants/student-import.constants';
import type {
  parsedStudentCsvSchema,
  studentImportRowErrorSchema,
  studentImportRowSchema,
} from '@/modules/student-import/schemas/student-import.schema';

export type StudentImportColumn = (typeof STUDENT_IMPORT_ALL_COLUMNS)[number];

export type StudentImportErrorReason = ParsedStudentRowError['reason'];

// One accepted row, shaped exactly like the portal preview/commit create row
// (minus the class, which comes from the dialog's picker): given name, family
// name, email, date of birth, year level, home language, optional student key.
// `line` is the 1-based line of the pasted/uploaded text, so an error can be
// pointed at the source.
export type ParsedStudentRow = z.infer<typeof studentImportRowSchema>;

export type ParsedStudentRowError = z.infer<typeof studentImportRowErrorSchema>;

export type ParsedStudentCsv = z.infer<typeof parsedStudentCsvSchema>;

// W4-21: the school's guardian-consent attestation as the import dialog holds it. The
// flow hook owns it and the dialog renders it; it is sent with the commit as the
// optional `consent_attestation` object (W4-14) and never with the preview.
export interface StudentImportAttestationState {
  options: ConsentAttestationOptions;
  selection: ConsentAttestationSelection;
  onChange: (next: ConsentAttestationSelection) => void;
  /** Guardian consent is required and data collection is not ticked: the import is held. */
  missing: boolean;
}
