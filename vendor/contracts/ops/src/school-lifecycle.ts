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
import { z } from 'zod';

import { documentIdSchema, dataEnvelope, type OpsOperation } from './core';
import { SCHOOL_SUSPEND_CODES } from './school-suspend';

const timestampSchema = z.iso.datetime({ offset: true });

const INT32_MAX = 2147483647;

/** Audit action names for the lifecycle writes that carry a reversible ledger. */
export const SCHOOL_ARCHIVE_AUDIT_ACTION = 'school.archive';

/** Stable `details.code` values for the lifecycle operations and their gates. */
export const SCHOOL_LIFECYCLE_CODES = {
  ...SCHOOL_SUSPEND_CODES,
  notArchived: 'SCHOOL_NOT_ARCHIVED',
  restoreNotAllowed: 'SCHOOL_RESTORE_NOT_ALLOWED',
  undoWindowExpired: 'UNDO_WINDOW_EXPIRED',
  undoNotLatest: 'UNDO_NOT_LATEST',
  undoConflict: 'UNDO_CONFLICT',
  unknownAction: 'UNDO_UNKNOWN_ACTION',
  setupIncomplete: 'SETUP_INCOMPLETE',
  trialExpired: 'TRIAL_EXPIRED',
} as const;
export type SchoolLifecycleCode =
  (typeof SCHOOL_LIFECYCLE_CODES)[keyof typeof SCHOOL_LIFECYCLE_CODES];

/* ------------------------------------------------------------------ *
 * Archive — POST /api/ops/schools/{documentId}/archive
 * ------------------------------------------------------------------ */

/**
 * The body IS the concurrency guard: `expected_updated_at` is mandatory (the
 * typed-name confirmation lives in the UI; this server key is the other half
 * of "both, not either"). Compared to the millisecond against the locked row.
 */
export const schoolArchiveBodySchema = z.strictObject({
  expected_updated_at: timestampSchema,
});
export type SchoolArchiveBody = z.infer<typeof schoolArchiveBodySchema>;

export const schoolArchiveResultSchema = z.strictObject({
  documentId: documentIdSchema,
  account_status: z.literal('closed'),
  archived_at: timestampSchema,
  action_documentId: documentIdSchema,
  updatedAt: timestampSchema,
});
export type SchoolArchiveResult = z.infer<typeof schoolArchiveResultSchema>;

/** Archive is reversible only while nothing else happened to the school. */
export const schoolArchiveLedgerSchema = z.strictObject({
  archived_at: timestampSchema,
  previous_status: z.string().nullable(),
});
export type SchoolArchiveLedger = z.infer<typeof schoolArchiveLedgerSchema>;

/** C-OPS-PORTAL-016 — POST /api/ops/schools/{documentId}/archive (versioned). */
export const SchoolArchiveOperation: OpsOperation<
  typeof schoolArchiveBodySchema,
  ReturnType<typeof dataEnvelope<typeof schoolArchiveResultSchema>>
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-016',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/archive',
  request: schoolArchiveBodySchema,
  response: dataEnvelope(schoolArchiveResultSchema),
  success: 200,
  errors: [400, 401, 403, 404, 409, 412, 429, 500],
});

/* ------------------------------------------------------------------ *
 * Restore — POST /api/ops/schools/{documentId}/restore
 * ------------------------------------------------------------------ */

export const schoolRestoreBodySchema = z.strictObject({});
export type SchoolRestoreBody = z.infer<typeof schoolRestoreBodySchema>;

export const schoolRestoreResultSchema = z.strictObject({
  documentId: documentIdSchema,
  account_status: z.literal('prospect'),
  onboarding_status: z.literal('not_started'),
  archived_at: z.null(),
  updatedAt: timestampSchema,
});
export type SchoolRestoreResult = z.infer<typeof schoolRestoreResultSchema>;

/** C-OPS-PORTAL-017 — POST /api/ops/schools/{documentId}/restore (versioned). */
export const SchoolRestoreOperation: OpsOperation<
  typeof schoolRestoreBodySchema,
  ReturnType<typeof dataEnvelope<typeof schoolRestoreResultSchema>>
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-017',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/restore',
  request: schoolRestoreBodySchema,
  response: dataEnvelope(schoolRestoreResultSchema),
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/* ------------------------------------------------------------------ *
 * Undo — POST /api/ops/schools/{documentId}/lifecycle-actions/{actionDocumentId}/undo
 * ------------------------------------------------------------------ */

export const schoolLifecycleUndoBodySchema = z.strictObject({});
export type SchoolLifecycleUndoBody = z.infer<typeof schoolLifecycleUndoBodySchema>;

/**
 * `undone` repeats the stored outcome on a replay; `reversed` names what the
 * reversal actually put back, so the client re-renders from server truth.
 */
export const schoolLifecycleUndoResultSchema = z.strictObject({
  documentId: documentIdSchema,
  action_documentId: documentIdSchema,
  action: z.enum(['suspend', 'archive']),
  undone: z.literal(true),
  account_status: z.string(),
  users_unblocked: z.number().int().min(0).max(INT32_MAX),
  sessions_resumed: z.number().int().min(0).max(INT32_MAX),
  archived_at: timestampSchema.nullable(),
  updatedAt: timestampSchema,
});
export type SchoolLifecycleUndoResult = z.infer<typeof schoolLifecycleUndoResultSchema>;

/** C-OPS-PORTAL-018 — POST .../lifecycle-actions/{actionDocumentId}/undo. */
export const SchoolLifecycleUndoOperation: OpsOperation<
  typeof schoolLifecycleUndoBodySchema,
  ReturnType<typeof dataEnvelope<typeof schoolLifecycleUndoResultSchema>>
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-018',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/lifecycle-actions/{actionDocumentId}/undo',
  request: schoolLifecycleUndoBodySchema,
  response: dataEnvelope(schoolLifecycleUndoResultSchema),
  success: 200,
  errors: [400, 401, 403, 404, 409, 410, 429, 500],
});
