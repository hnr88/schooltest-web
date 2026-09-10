import type { ImportReceiptState, OpsImportCommit } from '@schooltest/ops-contracts';

import type { PortalImportPreview } from '@/modules/ops/schemas/import.schema';
import type { OpsStudentImportProps } from '@/modules/ops/types/components.types';

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

/** ops/26 — one option bag: the class-page entry point pre-selects a class. */
export interface UseStudentImportOptions {
  initialClassDocumentId?: string;
}

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
  /** ops/26 — `:1690` the single CTA's per-stage label (real counts, not the demo's fixed ones). */
  ctaLabel: string;
  /** ops/26 — `:1699` opacity 0.55 on idle/validating/badType/tooBig/noRows, or a blocked write gate. */
  ctaDisabled: boolean;
  /** ops/26 — true only while a commit is in flight: the close guard's "Still saving" case. */
  busy: boolean;
  onCsvChange: (value: string) => void;
  onClassChange: (value: string | null) => void;
  onFile: (file: File | undefined) => Promise<void>;
  /** ops/26 — `:1702` `changeFile`: back to `idle` without touching the class picker. */
  changeFile: () => void;
  runPreview: () => Promise<void>;
  runCommit: () => Promise<void>;
  /** ops/26 — `:1226` `runImport`: the four guards, the write gate, then commit or retry. */
  runCta: () => Promise<void>;
  runCancel: () => Promise<void>;
  runUndo: () => Promise<void>;
  downloadErrorReport: () => Promise<void>;
}

/**
 * ops/26 — `OpsStudentImport`'s props, mounted twice: standalone as the
 * `OpsSchoolDetail.tsx` panel (unchanged; `documentId` only) and inside
 * `OpsStudentImportDialog` for the design's modal (the class page's
 * pre-selected class, and the dialog's "still saving" close guard).
 */
export interface OpsStudentImportPanelProps extends OpsStudentImportProps {
  initialClassDocumentId?: string;
  onBusyChange?: (busy: boolean) => void;
  /** ops/26 — the dialog wrapper supplies its own `DialogTitle`/`DialogDescription`. */
  hideHeader?: boolean;
}

/**
 * ops/26 (`:745-817` the IMPORT STUDENTS MODAL) — the two drawn entry
 * points: the Students tab primary button (task 18) opens with no class
 * chosen, the class page's "Add students"/"Import students" (task 21) opens
 * with `initialClassDocumentId` already set.
 */
export interface OpsStudentImportDialogProps {
  schoolDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClassDocumentId?: string;
}
