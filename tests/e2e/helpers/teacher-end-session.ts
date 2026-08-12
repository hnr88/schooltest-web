import { runSql } from './auth-db';

// Task 038 — the datastore half of the End-session evidence. C-TS-4's promised
// persistence effect is `sittings.status='closed'` + `closed_at`, so the spec
// reads those two columns out of PostgreSQL rather than believing the HTTP body.

export interface SittingLifecycleRow {
  status: string;
  closed_at: string;
}

/** The lifecycle columns of one sitting, keyed by its documentId. */
export function sittingRow(sittingDocumentId: string): SittingLifecycleRow {
  const [status = '', closedAt = ''] = runSql(
    `select status, coalesce(closed_at::text, '') from sittings
      where document_id = '${sittingDocumentId}'`,
  )
    .trim()
    .split('|');
  return { status, closed_at: closedAt };
}
