import type { ImportReceiptState, OpsImportCommit } from '@schooltest/ops-contracts';

import type { PortalImportPreview } from '@/modules/ops/schemas/import.schema';

/**
 * The ten cards the HTML draws for the import modal, in the design's own
 * vocabulary. Every one is DERIVED from server state plus what is in flight —
 * none is assigned by an event handler, so the modal cannot show a state the
 * data does not support.
 */
export type ImportCardState =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'rowErrors'
  | 'dupes'
  | 'badType'
  | 'tooBig'
  | 'noRows'
  | 'uploading'
  | 'failed';

export interface StudentImportApi {
  csv: string;
  fileName: string | null;
  classDocumentId: string | null;
  preview: PortalImportPreview | null;
  result: OpsImportCommit | null;
  card: ImportCardState;
  errorMessage: string | null;
  /** A dispatched write with no HTTP status: reconcile, never assume rollback. */
  unresolved: boolean;
  /** Whole percent from the receipt's own counts, or null when it has none. */
  progress: number | null;
  receiptState: ImportReceiptState | null;
  undoAvailable: boolean;
  /** Why undo is off — expired, already undone, or not yet known. Never silent. */
  undoUnavailableReason: string | null;
  canCommit: boolean;
  previewing: boolean;
  committing: boolean;
  cancelling: boolean;
  undoing: boolean;
  onCsvChange: (value: string) => void;
  onClassChange: (value: string | null) => void;
  onFile: (file: File | undefined) => Promise<void>;
  runPreview: () => Promise<void>;
  runCommit: () => Promise<void>;
  runCancel: () => Promise<void>;
  runUndo: () => Promise<void>;
  downloadErrorReport: () => Promise<void>;
}
