/**
 * D-UNDO — import receipt, cancellation and guarded undo (backlog task 01).
 *
 * The HTML's Cancel and Undo import controls must reflect actual server state
 * (decisions.md D-UNDO), so the receipt — not a toast — is the source of truth:
 *  - The receipt is SMALL: created IDs, the request digest, progress and the
 *    cancellation/commit state. NO generic background-job platform; the
 *    import runs inside the request and the receipt records what happened.
 *  - Cancellation succeeds only if it WINS against commit; otherwise the
 *    caller gets the completed outcome and can offer the guarded Undo.
 *  - Undo stays open 60 seconds after commit (same window as the school
 *    suspend rule) and succeeds ATOMICALLY only while every newly created
 *    record is still untouched.
 *  - Network loss has no status and cannot establish rollback (D-ERROR): an
 *    interrupted commit is reconciled through the receipt keyed by the
 *    request key, never by guessing from the client.
 */
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';

/** Undo stays open for 60 seconds after the write, matching school-suspend. */
export const IMPORT_UNDO_WINDOW_SECONDS = 60;

/** requestKey bounds, shared with the path parameters of all three routes. */
export const IMPORT_REQUEST_KEY_MIN = 16;
export const IMPORT_REQUEST_KEY_MAX = 128;
const IMPORT_ROWS_MAX = 1000;
const COUNT_MAX = 2_147_483_647;

const timestampSchema = z.iso.datetime({ offset: true });

/** One rejected CSV row: the spreadsheet row number (2..1001, header is row 1). */
export const opsImportRejectSchema = z.strictObject({
  row: z.number().int().min(2).max(1001),
  reason: z.string().min(1).max(2000),
});
export type OpsImportReject = z.infer<typeof opsImportRejectSchema>;

/** The commit outcome a receipt embeds once the write has a final state. */
export const opsImportCommitResultSchema = z.strictObject({
  created: z.number().int().min(0).max(IMPORT_ROWS_MAX),
  skipped: z.number().int().min(0).max(IMPORT_ROWS_MAX),
  rejected: z.array(opsImportRejectSchema).max(IMPORT_ROWS_MAX),
  import_documentId: documentIdSchema,
});
export type OpsImportCommit = z.infer<typeof opsImportCommitResultSchema>;

/** Receipt state machine: processing -> completed | failed | cancelled; undone. */
export const importReceiptStateSchema = z.enum([
  'processing',
  'completed',
  'failed',
  'cancelled',
  'undone',
]);
export type ImportReceiptState = z.infer<typeof importReceiptStateSchema>;

/** GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} — 200 body. */
export const opsImportReceiptSchema = z.strictObject({
  request_key: z.string().min(IMPORT_REQUEST_KEY_MIN).max(IMPORT_REQUEST_KEY_MAX),
  state: importReceiptStateSchema,
  result: opsImportCommitResultSchema.nullable(),
  undo_available: z.boolean(),
  processed_rows: z.number().int().min(0).max(IMPORT_ROWS_MAX),
  total_rows: z.number().int().min(0).max(IMPORT_ROWS_MAX),
  committed_at: timestampSchema.nullable(),
  undo_expires_at: timestampSchema.nullable(),
});
export type OpsImportReceipt = z.infer<typeof opsImportReceiptSchema>;

export const opsImportReceiptResponseSchema = dataEnvelope(opsImportReceiptSchema);
export type OpsImportReceiptResponse = z.infer<typeof opsImportReceiptResponseSchema>;

/** POST .../receipts/{requestKey}/cancel — 200 body: the race outcome, verbatim. */
export const opsImportCancelResultSchema = z.strictObject({
  request_key: z.string().min(IMPORT_REQUEST_KEY_MIN).max(IMPORT_REQUEST_KEY_MAX),
  state: z.enum(['cancelled', 'completed']),
  result: opsImportCommitResultSchema.nullable(),
});
export type OpsImportCancelResult = z.infer<typeof opsImportCancelResultSchema>;

export const opsImportCancelResponseSchema = dataEnvelope(opsImportCancelResultSchema);

/** POST .../import-students/{importDocumentId}/undo — 200 body. */
export const opsImportUndoResultSchema = z.strictObject({
  import_documentId: documentIdSchema,
  removed: z.number().int().min(0).max(COUNT_MAX),
  undone: z.literal(true),
});
export type OpsImportUndoResult = z.infer<typeof opsImportUndoResultSchema>;

export const opsImportUndoResponseSchema = dataEnvelope(opsImportUndoResultSchema);

/* ------------------------------------------------------------------ *
 * Path helpers (one spelling, shared by client and tests).
 * ------------------------------------------------------------------ */

export function importReceiptPath(schoolDocumentId: string, requestKey: string): string {
  return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/import-students/receipts/${encodeURIComponent(requestKey)}`;
}

export function importCancelPath(schoolDocumentId: string, requestKey: string): string {
  return `${importReceiptPath(schoolDocumentId, requestKey)}/cancel`;
}

export function importUndoPath(schoolDocumentId: string, importDocumentId: string): string {
  return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/import-students/${encodeURIComponent(importDocumentId)}/undo`;
}

/* ------------------------------------------------------------------ *
 * The three operations take no body; unknown keys are rejected, not dropped.
 * Declared BEFORE the operations so the CommonJS build never reads a TDZ const.
 * ------------------------------------------------------------------ */

export const importReceiptBodySchema = z.strictObject({});
export const importCancelBodySchema = z.strictObject({});
export const importUndoBodySchema = z.strictObject({});

/* ------------------------------------------------------------------ *
 * The named operations.
 * ------------------------------------------------------------------ */

/** C-OPS-PORTAL-049 — GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} */
export const ImportReceiptOperation: OpsOperation<
  typeof importReceiptBodySchema,
  typeof opsImportReceiptResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-049',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/import-students/receipts/{requestKey}',
  request: importReceiptBodySchema,
  response: opsImportReceiptResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/** C-OPS-PORTAL-072 — POST /api/ops/schools/{documentId}/import-students/receipts/{requestKey}/cancel */
export const ImportCancelOperation: OpsOperation<
  typeof importCancelBodySchema,
  typeof opsImportCancelResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-072',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/import-students/receipts/{requestKey}/cancel',
  request: importCancelBodySchema,
  response: opsImportCancelResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 409, 429, 500],
});

/** C-OPS-PORTAL-050 — POST /api/ops/schools/{documentId}/import-students/{importDocumentId}/undo */
export const ImportUndoOperation: OpsOperation<
  typeof importUndoBodySchema,
  typeof opsImportUndoResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-050',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/import-students/{importDocumentId}/undo',
  request: importUndoBodySchema,
  response: opsImportUndoResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 409, 429, 500],
});
