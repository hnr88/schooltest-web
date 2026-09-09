"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolLifecycleUndoOperation = exports.schoolLifecycleUndoResultSchema = exports.schoolLifecycleUndoBodySchema = exports.SchoolRestoreOperation = exports.schoolRestoreResultSchema = exports.schoolRestoreBodySchema = exports.SchoolArchiveOperation = exports.schoolArchiveLedgerSchema = exports.schoolArchiveResultSchema = exports.schoolArchiveBodySchema = exports.SCHOOL_LIFECYCLE_CODES = exports.SCHOOL_ARCHIVE_AUDIT_ACTION = void 0;
/**
 * C-OPS-PORTAL-014..18 (task 12) — the REST of the school lifecycle beside the
 * suspension contract: Archive, Restore and the Undo window, plus the gate
 * codes the boundaries enforce.
 *
 * The Archived state rides the EXISTING `closed` account_status (the schema's
 * own terminal value — no relabelling of pre-portal closed schools, whose
 * `archived_at` stays null); the new nullable `schools.archived_at` column is
 * what tells a portal archive apart from a legacy closure. Archive keeps
 * students, classes and results: it flips ONLY the school row, so its ledger
 * is small and Undo of an archive is exactly one guarded row write back.
 *
 * Undo shares the suspension's provenance model: the action's audit row IS the
 * ledger, the 60-second window runs from the ORIGINAL commit, and a repeat
 * returns the stored outcome instead of reversing twice.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const school_suspend_1 = require("./school-suspend");
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
const INT32_MAX = 2147483647;
/** Audit action names for the lifecycle writes that carry a reversible ledger. */
exports.SCHOOL_ARCHIVE_AUDIT_ACTION = 'school.archive';
/** Stable `details.code` values for the lifecycle operations and their gates. */
exports.SCHOOL_LIFECYCLE_CODES = {
    ...school_suspend_1.SCHOOL_SUSPEND_CODES,
    notArchived: 'SCHOOL_NOT_ARCHIVED',
    restoreNotAllowed: 'SCHOOL_RESTORE_NOT_ALLOWED',
    undoWindowExpired: 'UNDO_WINDOW_EXPIRED',
    undoNotLatest: 'UNDO_NOT_LATEST',
    undoConflict: 'UNDO_CONFLICT',
    unknownAction: 'UNDO_UNKNOWN_ACTION',
    setupIncomplete: 'SETUP_INCOMPLETE',
    trialExpired: 'TRIAL_EXPIRED',
};
/* ------------------------------------------------------------------ *
 * Archive — POST /api/ops/schools/{documentId}/archive
 * ------------------------------------------------------------------ */
/**
 * The body IS the concurrency guard: `expected_updated_at` is mandatory (the
 * typed-name confirmation lives in the UI; this server key is the other half
 * of "both, not either"). Compared to the millisecond against the locked row.
 */
exports.schoolArchiveBodySchema = zod_1.z.strictObject({
    expected_updated_at: timestampSchema,
});
exports.schoolArchiveResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    account_status: zod_1.z.literal('closed'),
    archived_at: timestampSchema,
    action_documentId: core_1.documentIdSchema,
    updatedAt: timestampSchema,
});
/** Archive is reversible only while nothing else happened to the school. */
exports.schoolArchiveLedgerSchema = zod_1.z.strictObject({
    archived_at: timestampSchema,
    previous_status: zod_1.z.string().nullable(),
});
/** C-OPS-PORTAL-016 — POST /api/ops/schools/{documentId}/archive (versioned). */
exports.SchoolArchiveOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-016',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/archive',
    request: exports.schoolArchiveBodySchema,
    response: (0, core_1.dataEnvelope)(exports.schoolArchiveResultSchema),
    success: 200,
    errors: [400, 401, 403, 404, 409, 412, 429, 500],
});
/* ------------------------------------------------------------------ *
 * Restore — POST /api/ops/schools/{documentId}/restore
 * ------------------------------------------------------------------ */
exports.schoolRestoreBodySchema = zod_1.z.strictObject({});
exports.schoolRestoreResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    account_status: zod_1.z.literal('prospect'),
    onboarding_status: zod_1.z.literal('not_started'),
    archived_at: zod_1.z.null(),
    updatedAt: timestampSchema,
});
/** C-OPS-PORTAL-017 — POST /api/ops/schools/{documentId}/restore (versioned). */
exports.SchoolRestoreOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-017',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/restore',
    request: exports.schoolRestoreBodySchema,
    response: (0, core_1.dataEnvelope)(exports.schoolRestoreResultSchema),
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/* ------------------------------------------------------------------ *
 * Undo — POST /api/ops/schools/{documentId}/lifecycle-actions/{actionDocumentId}/undo
 * ------------------------------------------------------------------ */
exports.schoolLifecycleUndoBodySchema = zod_1.z.strictObject({});
/**
 * `undone` repeats the stored outcome on a replay; `reversed` names what the
 * reversal actually put back, so the client re-renders from server truth.
 */
exports.schoolLifecycleUndoResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    action_documentId: core_1.documentIdSchema,
    action: zod_1.z.enum(['suspend', 'archive']),
    undone: zod_1.z.literal(true),
    account_status: zod_1.z.string(),
    users_unblocked: zod_1.z.number().int().min(0).max(INT32_MAX),
    sessions_resumed: zod_1.z.number().int().min(0).max(INT32_MAX),
    archived_at: timestampSchema.nullable(),
    updatedAt: timestampSchema,
});
/** C-OPS-PORTAL-018 — POST .../lifecycle-actions/{actionDocumentId}/undo. */
exports.SchoolLifecycleUndoOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-018',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/lifecycle-actions/{actionDocumentId}/undo',
    request: exports.schoolLifecycleUndoBodySchema,
    response: (0, core_1.dataEnvelope)(exports.schoolLifecycleUndoResultSchema),
    success: 200,
    errors: [400, 401, 403, 404, 409, 410, 429, 500],
});
