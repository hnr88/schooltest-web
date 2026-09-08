/**
 * Ledger row 11 / D-007 web types. The payload shapes are the shared contract's
 * own `z.infer` types (`@schooltest/ops-contracts/inspection`) — never a second
 * hand-written copy — so the only types declared here are the ones that exist
 * purely in the browser: a downloaded file and the three components' props.
 */
import type { FormInspection } from '@schooltest/ops-contracts';

import type { OpsForm } from '@/modules/ops/schemas/form-window.schema';

/** What the lazy responses.csv query hands the download helper. */
export interface OpsResponsesCsvFile {
  filename: string;
  csv: string;
}

export interface OpsFormInspectionProps {
  /** The form the school's live window points at; null when no window is live. */
  formDocumentId: string | null;
  /** The window panel already renders the code — passed so the two cannot disagree. */
  formCode: string | null;
  /**
   * The picker list the window panel has ALREADY fetched (core GET /api/forms).
   * Passed rather than re-queried: `form_windows` is empty in the current
   * database, so without a selectable form this surface would render nothing
   * anywhere.
   */
  forms: OpsForm[];
}

export interface OpsFormInspectionTableProps {
  inspection: FormInspection;
}

export interface OpsViewAsTeacherPanelProps {
  teacherDocumentId: string;
  /** Shown in the impersonation banner so the operator sees WHO they are viewing. */
  teacherEmail: string | null;
  onClose: () => void;
}
