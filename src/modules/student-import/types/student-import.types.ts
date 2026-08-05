import type { z } from 'zod';

import type {
  ACARA_PHASES,
  FIRST_LANGUAGES,
  STUDENT_IMPORT_COLUMNS,
} from '@/modules/student-import/constants/student-import.constants';
import type {
  parsedStudentCsvSchema,
  studentImportRowErrorSchema,
  studentImportRowSchema,
} from '@/modules/student-import/schemas/student-import.schema';

export type AcaraPhase = (typeof ACARA_PHASES)[number];

export type StudentImportFirstLanguage = (typeof FIRST_LANGUAGES)[number];

export type StudentImportColumn = (typeof STUDENT_IMPORT_COLUMNS)[number];

export type StudentImportErrorReason = ParsedStudentRowError['reason'];

// One accepted row, keyed exactly like the C-CHD-02 write body so a consumer
// can post it without a second mapping step. `line` is the 1-based line of the
// pasted/uploaded text, so an error can be pointed at the source.
export type ParsedStudentRow = z.infer<typeof studentImportRowSchema>;

export type ParsedStudentRowError = z.infer<typeof studentImportRowErrorSchema>;

export type ParsedStudentCsv = z.infer<typeof parsedStudentCsvSchema>;
