"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportUndoOperation = exports.ImportCancelOperation = exports.ImportReceiptOperation = exports.importUndoBodySchema = exports.importCancelBodySchema = exports.importReceiptBodySchema = exports.opsImportUndoResponseSchema = exports.opsImportUndoResultSchema = exports.opsImportCancelResponseSchema = exports.opsImportCancelResultSchema = exports.opsImportReceiptResponseSchema = exports.opsImportReceiptSchema = exports.importReceiptStateSchema = exports.opsImportCommitResultSchema = exports.opsImportRejectSchema = exports.IMPORT_REQUEST_KEY_MAX = exports.IMPORT_REQUEST_KEY_MIN = exports.IMPORT_UNDO_WINDOW_SECONDS = void 0;
exports.importReceiptPath = importReceiptPath;
exports.importCancelPath = importCancelPath;
exports.importUndoPath = importUndoPath;
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
const zod_1 = require("zod");
const core_1 = require("./core");
/** Undo stays open for 60 seconds after the write, matching school-suspend. */
exports.IMPORT_UNDO_WINDOW_SECONDS = 60;
/** requestKey bounds, shared with the path parameters of all three routes. */
exports.IMPORT_REQUEST_KEY_MIN = 16;
exports.IMPORT_REQUEST_KEY_MAX = 128;
const IMPORT_ROWS_MAX = 1000;
const COUNT_MAX = 2147483647;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
/** One rejected CSV row: the spreadsheet row number (2..1001, header is row 1). */
exports.opsImportRejectSchema = zod_1.z.strictObject({
    row: zod_1.z.number().int().min(2).max(1001),
    reason: zod_1.z.string().min(1).max(2000),
});
/** The commit outcome a receipt embeds once the write has a final state. */
exports.opsImportCommitResultSchema = zod_1.z.strictObject({
    created: zod_1.z.number().int().min(0).max(IMPORT_ROWS_MAX),
    skipped: zod_1.z.number().int().min(0).max(IMPORT_ROWS_MAX),
    rejected: zod_1.z.array(exports.opsImportRejectSchema).max(IMPORT_ROWS_MAX),
    import_documentId: core_1.documentIdSchema,
});
/** Receipt state machine: processing -> completed | failed | cancelled; undone. */
exports.importReceiptStateSchema = zod_1.z.enum([
    'processing',
    'completed',
    'failed',
    'cancelled',
    'undone',
]);
/** GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} — 200 body. */
exports.opsImportReceiptSchema = zod_1.z.strictObject({
    request_key: zod_1.z.string().min(exports.IMPORT_REQUEST_KEY_MIN).max(exports.IMPORT_REQUEST_KEY_MAX),
    state: exports.importReceiptStateSchema,
    result: exports.opsImportCommitResultSchema.nullable(),
    undo_available: zod_1.z.boolean(),
    processed_rows: zod_1.z.number().int().min(0).max(IMPORT_ROWS_MAX),
    total_rows: zod_1.z.number().int().min(0).max(IMPORT_ROWS_MAX),
    committed_at: timestampSchema.nullable(),
    undo_expires_at: timestampSchema.nullable(),
});
exports.opsImportReceiptResponseSchema = (0, core_1.dataEnvelope)(exports.opsImportReceiptSchema);
/** POST .../receipts/{requestKey}/cancel — 200 body: the race outcome, verbatim. */
exports.opsImportCancelResultSchema = zod_1.z.strictObject({
    request_key: zod_1.z.string().min(exports.IMPORT_REQUEST_KEY_MIN).max(exports.IMPORT_REQUEST_KEY_MAX),
    state: zod_1.z.enum(['cancelled', 'completed']),
    result: exports.opsImportCommitResultSchema.nullable(),
});
exports.opsImportCancelResponseSchema = (0, core_1.dataEnvelope)(exports.opsImportCancelResultSchema);
/** POST .../import-students/{importDocumentId}/undo — 200 body. */
exports.opsImportUndoResultSchema = zod_1.z.strictObject({
    import_documentId: core_1.documentIdSchema,
    removed: zod_1.z.number().int().min(0).max(COUNT_MAX),
    undone: zod_1.z.literal(true),
});
exports.opsImportUndoResponseSchema = (0, core_1.dataEnvelope)(exports.opsImportUndoResultSchema);
/* ------------------------------------------------------------------ *
 * Path helpers (one spelling, shared by client and tests).
 * ------------------------------------------------------------------ */
function importReceiptPath(schoolDocumentId, requestKey) {
    return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/import-students/receipts/${encodeURIComponent(requestKey)}`;
}
function importCancelPath(schoolDocumentId, requestKey) {
    return `${importReceiptPath(schoolDocumentId, requestKey)}/cancel`;
}
function importUndoPath(schoolDocumentId, importDocumentId) {
    return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/import-students/${encodeURIComponent(importDocumentId)}/undo`;
}
/* ------------------------------------------------------------------ *
 * The three operations take no body; unknown keys are rejected, not dropped.
 * Declared BEFORE the operations so the CommonJS build never reads a TDZ const.
 * ------------------------------------------------------------------ */
exports.importReceiptBodySchema = zod_1.z.strictObject({});
exports.importCancelBodySchema = zod_1.z.strictObject({});
exports.importUndoBodySchema = zod_1.z.strictObject({});
/* ------------------------------------------------------------------ *
 * The named operations.
 * ------------------------------------------------------------------ */
/** C-OPS-PORTAL-049 — GET /api/ops/schools/{documentId}/import-students/receipts/{requestKey} */
exports.ImportReceiptOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-049',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/import-students/receipts/{requestKey}',
    request: exports.importReceiptBodySchema,
    response: exports.opsImportReceiptResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/** C-OPS-PORTAL-072 — POST /api/ops/schools/{documentId}/import-students/receipts/{requestKey}/cancel */
exports.ImportCancelOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-072',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/import-students/receipts/{requestKey}/cancel',
    request: exports.importCancelBodySchema,
    response: exports.opsImportCancelResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
/** C-OPS-PORTAL-050 — POST /api/ops/schools/{documentId}/import-students/{importDocumentId}/undo */
exports.ImportUndoOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-050',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/import-students/{importDocumentId}/undo',
    request: exports.importUndoBodySchema,
    response: exports.opsImportUndoResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
