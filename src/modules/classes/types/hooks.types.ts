import type { OpsImportReject } from '@schooltest/ops-contracts';

import type { ParsedStudentCsv } from '@/modules/student-import';

export interface StrapiErrorEnvelope {
  error?: { message?: string };
}

// The class-detail CSV import state (spec §1 "Import students"), on the shared
// preview→commit engine. No class selector: the target class is fixed.
export interface ClassStudentImportState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv, csv: string) => void;
  /** The rows the SERVER refused on the last submit, each with its row number. */
  rejects: readonly OpsImportReject[];
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
}
