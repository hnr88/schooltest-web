/**
 * OPS-015 / C-OPS-PORTAL-005 — POST /api/ops/schools/{documentId}/suspend.
 *
 * ONE definition of the suspension contract, imported by the Strapi service
 * that enforces it, by the web mutation that calls it and by the HTTP suites on
 * both sides. Two response shapes live here on purpose, because the operation
 * has two contracts (D-COMPAT):
 *
 *  - `schoolSuspendLegacyResultSchema` is the OBSERVED baseline an unversioned
 *    caller already receives today. It is frozen: an existing integration that
 *    omits `X-Ops-Portal-Version` must keep parsing the exact same three keys.
 *  - `schoolSuspendResultSchema` is the versioned contract. It adds the audit
 *    action that anchors the pause ledger, the Undo deadline and the new row
 *    version, so a versioned client can render the paused-windows banner and
 *    issue a correct `If-Match` on its next lifecycle write.
 *
 * The pause ledger is the provenance both suspension and its inverse read. It
 * records what suspension actually paused — which accounts it blocked, and how
 * much assessed time each in-flight session had left at the instant of the
 * pause — so reactivation restores exactly that and never grants extra time.
 * Repeating a suspension cannot double-shift a deadline because a school that
 * is already suspended is rejected before a second ledger can be written.
 */
import { z } from 'zod';
import { dataEnvelope, type OpsOperation } from './core';
/** Undo stays open for 60 seconds after the write, matching the import receipt rule. */
export declare const SCHOOL_SUSPEND_UNDO_WINDOW_SECONDS = 60;
/** The audit action name that carries the pause ledger for one suspension. */
export declare const SCHOOL_SUSPEND_AUDIT_ACTION = "school.suspend";
/**
 * Stable `details.code` values. The HTTP status is fixed by the operation, so
 * the code is what lets a client tell "already suspended" from "archived"
 * without parsing prose.
 */
export declare const SCHOOL_SUSPEND_CODES: {
    readonly alreadySuspended: "SCHOOL_ALREADY_SUSPENDED";
    readonly archived: "SCHOOL_ARCHIVED";
    readonly versionRequired: "IF_MATCH_REQUIRED";
    readonly versionInvalid: "IF_MATCH_INVALID";
    readonly versionStale: "IF_MATCH_STALE";
};
export type SchoolSuspendCode = (typeof SCHOOL_SUSPEND_CODES)[keyof typeof SCHOOL_SUSPEND_CODES];
/** The legacy `account_status` value that carries the portal's Archived state. */
export declare const SCHOOL_ARCHIVED_ACCOUNT_STATUS = "closed";
/** The operation takes no body; an unknown key is rejected rather than dropped. */
export declare const schoolSuspendBodySchema: z.ZodObject<{}, z.core.$strict>;
export type SchoolSuspendBody = z.infer<typeof schoolSuspendBodySchema>;
/**
 * Unversioned 200 body. Frozen baseline — do NOT add keys here; a legacy caller
 * parses this shape and the strict object would reject anything new anyway.
 */
export declare const schoolSuspendLegacyResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    account_status: z.ZodLiteral<"suspended">;
    users_blocked: z.ZodNumber;
}, z.core.$strict>;
export type SchoolSuspendLegacyResult = z.infer<typeof schoolSuspendLegacyResultSchema>;
/**
 * Versioned 200 body. `updatedAt` is the row version the NEXT lifecycle write
 * must quote in `If-Match`, so a client never has to invent a current-time
 * token; `action_documentId` names the audit row holding this suspension's
 * pause ledger, which is what Undo and reactivation replay.
 */
export declare const schoolSuspendResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    account_status: z.ZodLiteral<"suspended">;
    users_blocked: z.ZodNumber;
    action_documentId: z.ZodString;
    undo_expires_at: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SchoolSuspendResult = z.infer<typeof schoolSuspendResultSchema>;
/**
 * One paused in-flight session. `remaining_seconds` is the assessed time left
 * when the pause began, or null when the session carries no timed budget —
 * null means "unknown", never "zero", so resuming can never silently score a
 * session out. `stage` pins which timed section the snapshot belongs to.
 */
export declare const schoolSuspendPauseEntrySchema: z.ZodObject<{
    session_documentId: z.ZodString;
    stage: z.ZodNullable<z.ZodNumber>;
    started_at: z.ZodNullable<z.ZodISODateTime>;
    remaining_seconds: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export type SchoolSuspendPauseEntry = z.infer<typeof schoolSuspendPauseEntrySchema>;
/**
 * The suspension provenance written inside the audit row's `detail`. Both the
 * legacy and the versioned path write `blocked_user_ids`, because reactivation
 * has always read that key; the versioned path additionally records the pause
 * instant and the session snapshots.
 */
export declare const schoolSuspendLedgerSchema: z.ZodObject<{
    paused_at: z.ZodISODateTime;
    previous_status: z.ZodNullable<z.ZodString>;
    blocked_user_ids: z.ZodArray<z.ZodNumber>;
    paused_sessions: z.ZodArray<z.ZodObject<{
        session_documentId: z.ZodString;
        stage: z.ZodNullable<z.ZodNumber>;
        started_at: z.ZodNullable<z.ZodISODateTime>;
        remaining_seconds: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strict>>;
    resumed_at: z.ZodOptional<z.ZodNullable<z.ZodISODateTime>>;
}, z.core.$strict>;
export type SchoolSuspendLedger = z.infer<typeof schoolSuspendLedgerSchema>;
/** Render a row's `updatedAt` as the quoted entity-tag a caller must send back. */
export declare function formatResourceVersion(updatedAt: string | Date): string;
export type ResourceVersionParse = {
    readonly ok: true;
    readonly instantMs: number;
} | {
    readonly ok: false;
    readonly code: typeof SCHOOL_SUSPEND_CODES.versionRequired | typeof SCHOOL_SUSPEND_CODES.versionInvalid;
    readonly message: string;
};
/**
 * Parse an `If-Match` header into a comparable instant.
 *
 * Absent is its own outcome, not an invalid one, so the server can answer the
 * contract's 400/IF_MATCH_REQUIRED with a message that names the fix. A weak
 * validator (`W/"…"`) is rejected: a weak tag promises only semantic
 * equivalence, which is not a safe basis for a lifecycle write. `*` is rejected
 * for the same reason — it would mean "any version", which defeats the check.
 */
export declare function parseResourceVersion(raw: string | string[] | null | undefined): ResourceVersionParse;
/**
 * Whether a parsed version still matches the row. Compared to the millisecond,
 * because two writes inside one millisecond are indistinguishable by an
 * updatedAt version and must not be reported as a match on rounded seconds.
 */
export declare function resourceVersionMatches(instantMs: number, currentUpdatedAt: string | Date): boolean;
/** C-OPS-PORTAL-005 — POST /api/ops/schools/{documentId}/suspend (versioned). */
export declare const SchoolSuspendOperation: OpsOperation<typeof schoolSuspendBodySchema, ReturnType<typeof dataEnvelope<typeof schoolSuspendResultSchema>>>;
