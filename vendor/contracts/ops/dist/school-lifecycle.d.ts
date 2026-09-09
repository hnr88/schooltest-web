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
import { dataEnvelope, type OpsOperation } from './core';
/** Audit action names for the lifecycle writes that carry a reversible ledger. */
export declare const SCHOOL_ARCHIVE_AUDIT_ACTION = "school.archive";
/** Stable `details.code` values for the lifecycle operations and their gates. */
export declare const SCHOOL_LIFECYCLE_CODES: {
    readonly notArchived: "SCHOOL_NOT_ARCHIVED";
    readonly restoreNotAllowed: "SCHOOL_RESTORE_NOT_ALLOWED";
    readonly undoWindowExpired: "UNDO_WINDOW_EXPIRED";
    readonly undoNotLatest: "UNDO_NOT_LATEST";
    readonly undoConflict: "UNDO_CONFLICT";
    readonly unknownAction: "UNDO_UNKNOWN_ACTION";
    readonly setupIncomplete: "SETUP_INCOMPLETE";
    readonly trialExpired: "TRIAL_EXPIRED";
    readonly alreadySuspended: "SCHOOL_ALREADY_SUSPENDED";
    readonly archived: "SCHOOL_ARCHIVED";
    readonly versionRequired: "IF_MATCH_REQUIRED";
    readonly versionInvalid: "IF_MATCH_INVALID";
    readonly versionStale: "IF_MATCH_STALE";
};
export type SchoolLifecycleCode = (typeof SCHOOL_LIFECYCLE_CODES)[keyof typeof SCHOOL_LIFECYCLE_CODES];
/**
 * The body IS the concurrency guard: `expected_updated_at` is mandatory (the
 * typed-name confirmation lives in the UI; this server key is the other half
 * of "both, not either"). Compared to the millisecond against the locked row.
 */
export declare const schoolArchiveBodySchema: z.ZodObject<{
    expected_updated_at: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolArchiveBody = z.infer<typeof schoolArchiveBodySchema>;
export declare const schoolArchiveResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    account_status: z.ZodLiteral<"closed">;
    archived_at: z.ZodISODateTime;
    action_documentId: z.ZodString;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolArchiveResult = z.infer<typeof schoolArchiveResultSchema>;
/** Archive is reversible only while nothing else happened to the school. */
export declare const schoolArchiveLedgerSchema: z.ZodObject<{
    archived_at: z.ZodISODateTime;
    previous_status: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type SchoolArchiveLedger = z.infer<typeof schoolArchiveLedgerSchema>;
/** C-OPS-PORTAL-016 — POST /api/ops/schools/{documentId}/archive (versioned). */
export declare const SchoolArchiveOperation: OpsOperation<typeof schoolArchiveBodySchema, ReturnType<typeof dataEnvelope<typeof schoolArchiveResultSchema>>>;
export declare const schoolRestoreBodySchema: z.ZodObject<{}, z.core.$strict>;
export type SchoolRestoreBody = z.infer<typeof schoolRestoreBodySchema>;
export declare const schoolRestoreResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    account_status: z.ZodLiteral<"prospect">;
    onboarding_status: z.ZodLiteral<"not_started">;
    archived_at: z.ZodNull;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolRestoreResult = z.infer<typeof schoolRestoreResultSchema>;
/** C-OPS-PORTAL-017 — POST /api/ops/schools/{documentId}/restore (versioned). */
export declare const SchoolRestoreOperation: OpsOperation<typeof schoolRestoreBodySchema, ReturnType<typeof dataEnvelope<typeof schoolRestoreResultSchema>>>;
export declare const schoolLifecycleUndoBodySchema: z.ZodObject<{}, z.core.$strict>;
export type SchoolLifecycleUndoBody = z.infer<typeof schoolLifecycleUndoBodySchema>;
/**
 * `undone` repeats the stored outcome on a replay; `reversed` names what the
 * reversal actually put back, so the client re-renders from server truth.
 */
export declare const schoolLifecycleUndoResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    action_documentId: z.ZodString;
    action: z.ZodEnum<{
        suspend: "suspend";
        archive: "archive";
    }>;
    undone: z.ZodLiteral<true>;
    account_status: z.ZodString;
    users_unblocked: z.ZodNumber;
    sessions_resumed: z.ZodNumber;
    archived_at: z.ZodNullable<z.ZodISODateTime>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolLifecycleUndoResult = z.infer<typeof schoolLifecycleUndoResultSchema>;
/** C-OPS-PORTAL-018 — POST .../lifecycle-actions/{actionDocumentId}/undo. */
export declare const SchoolLifecycleUndoOperation: OpsOperation<typeof schoolLifecycleUndoBodySchema, ReturnType<typeof dataEnvelope<typeof schoolLifecycleUndoResultSchema>>>;
