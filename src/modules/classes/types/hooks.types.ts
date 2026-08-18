import type { ParsedStudentCsv } from '@/modules/student-import';

export interface StrapiErrorEnvelope {
  error?: { message?: string };
}

// The class-detail CSV import state (spec §1 "Import students"), on top of the
// shared C-CHD-02 batch write. No class selector: the target class is fixed.
export interface ClassStudentImportState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv) => void;
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
}
