"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolSuspendOperation = exports.schoolSuspendLedgerSchema = exports.schoolSuspendPauseEntrySchema = exports.schoolSuspendResultSchema = exports.schoolSuspendLegacyResultSchema = exports.schoolSuspendBodySchema = exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS = exports.SCHOOL_SUSPEND_CODES = exports.SCHOOL_SUSPEND_AUDIT_ACTION = exports.SCHOOL_SUSPEND_UNDO_WINDOW_SECONDS = void 0;
exports.formatResourceVersion = formatResourceVersion;
exports.parseResourceVersion = parseResourceVersion;
exports.resourceVersionMatches = resourceVersionMatches;
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
const zod_1 = require("zod");
const core_1 = require("./core");
/** Undo stays open for 60 seconds after the write, matching the import receipt rule. */
exports.SCHOOL_SUSPEND_UNDO_WINDOW_SECONDS = 60;
/** The audit action name that carries the pause ledger for one suspension. */
exports.SCHOOL_SUSPEND_AUDIT_ACTION = 'school.suspend';
/**
 * Stable `details.code` values. The HTTP status is fixed by the operation, so
 * the code is what lets a client tell "already suspended" from "archived"
 * without parsing prose.
 */
exports.SCHOOL_SUSPEND_CODES = {
    alreadySuspended: 'SCHOOL_ALREADY_SUSPENDED',
    archived: 'SCHOOL_ARCHIVED',
    versionRequired: 'IF_MATCH_REQUIRED',
    versionInvalid: 'IF_MATCH_INVALID',
    versionStale: 'IF_MATCH_STALE',
};
/** The legacy `account_status` value that carries the portal's Archived state. */
exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS = 'closed';
/** The operation takes no body; an unknown key is rejected rather than dropped. */
exports.schoolSuspendBodySchema = zod_1.z.strictObject({});
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
/** Postgres int4 upper bound — the contract's declared `users_blocked` ceiling. */
const INT32_MAX = 2147483647;
/**
 * Unversioned 200 body. Frozen baseline — do NOT add keys here; a legacy caller
 * parses this shape and the strict object would reject anything new anyway.
 */
exports.schoolSuspendLegacyResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    account_status: zod_1.z.literal('suspended'),
    users_blocked: zod_1.z.number().int().min(0).max(INT32_MAX),
});
/**
 * Versioned 200 body. `updatedAt` is the row version the NEXT lifecycle write
 * must quote in `If-Match`, so a client never has to invent a current-time
 * token; `action_documentId` names the audit row holding this suspension's
 * pause ledger, which is what Undo and reactivation replay.
 */
exports.schoolSuspendResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    account_status: zod_1.z.literal('suspended'),
    users_blocked: zod_1.z.number().int().min(0).max(INT32_MAX),
    action_documentId: core_1.documentIdSchema,
    undo_expires_at: timestampSchema,
    updatedAt: timestampSchema,
});
/**
 * One paused in-flight session. `remaining_seconds` is the assessed time left
 * when the pause began, or null when the session carries no timed budget —
 * null means "unknown", never "zero", so resuming can never silently score a
 * session out. `stage` pins which timed section the snapshot belongs to.
 */
exports.schoolSuspendPauseEntrySchema = zod_1.z.strictObject({
    session_documentId: core_1.documentIdSchema,
    stage: zod_1.z.number().int().min(0).nullable(),
    started_at: timestampSchema.nullable(),
    remaining_seconds: zod_1.z.number().int().min(0).nullable(),
});
/**
 * The suspension provenance written inside the audit row's `detail`. Both the
 * legacy and the versioned path write `blocked_user_ids`, because reactivation
 * has always read that key; the versioned path additionally records the pause
 * instant and the session snapshots.
 */
exports.schoolSuspendLedgerSchema = zod_1.z.strictObject({
    paused_at: timestampSchema,
    previous_status: zod_1.z.string().nullable(),
    blocked_user_ids: zod_1.z.array(zod_1.z.number().int().min(1)),
    paused_sessions: zod_1.z.array(exports.schoolSuspendPauseEntrySchema),
    /**
     * Written ONCE by the reactivation that shifted the paused deadlines — the
     * compare-and-set that makes the shift exactly-once (a second Activate or a
     * racing Undo finds it set and shifts nothing). Absent on pre-activation
     * ledgers, which is why it is optional rather than nullable-with-default.
     */
    resumed_at: timestampSchema.nullable().optional(),
});
/* ------------------------------------------------------------------ *
 * If-Match — the per-resource version, shared so the client that sends
 * the header and the server that compares it cannot disagree on format.
 * ------------------------------------------------------------------ */
/** Render a row's `updatedAt` as the quoted entity-tag a caller must send back. */
function formatResourceVersion(updatedAt) {
    const iso = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;
    return `"${iso}"`;
}
/**
 * Parse an `If-Match` header into a comparable instant.
 *
 * Absent is its own outcome, not an invalid one, so the server can answer the
 * contract's 400/IF_MATCH_REQUIRED with a message that names the fix. A weak
 * validator (`W/"…"`) is rejected: a weak tag promises only semantic
 * equivalence, which is not a safe basis for a lifecycle write. `*` is rejected
 * for the same reason — it would mean "any version", which defeats the check.
 */
function parseResourceVersion(raw) {
    if (raw === undefined || raw === null || raw === '') {
        return {
            ok: false,
            code: exports.SCHOOL_SUSPEND_CODES.versionRequired,
            message: 'If-Match is required: quote the updatedAt from the school you fetched.',
        };
    }
    if (Array.isArray(raw)) {
        return {
            ok: false,
            code: exports.SCHOOL_SUSPEND_CODES.versionInvalid,
            message: 'If-Match must carry exactly one quoted version.',
        };
    }
    const match = /^"([^"]+)"$/.exec(raw.trim());
    if (!match) {
        return {
            ok: false,
            code: exports.SCHOOL_SUSPEND_CODES.versionInvalid,
            message: 'If-Match must be the quoted updatedAt of the fetched school, e.g. "2026-09-05T09:00:00.000Z".',
        };
    }
    const instantMs = Date.parse(match[1]);
    if (!Number.isFinite(instantMs)) {
        return {
            ok: false,
            code: exports.SCHOOL_SUSPEND_CODES.versionInvalid,
            message: 'If-Match must quote an ISO-8601 timestamp.',
        };
    }
    return { ok: true, instantMs };
}
/**
 * Whether a parsed version still matches the row. Compared to the millisecond,
 * because two writes inside one millisecond are indistinguishable by an
 * updatedAt version and must not be reported as a match on rounded seconds.
 */
function resourceVersionMatches(instantMs, currentUpdatedAt) {
    const current = currentUpdatedAt instanceof Date ? currentUpdatedAt.getTime() : Date.parse(currentUpdatedAt);
    return Number.isFinite(current) && current === instantMs;
}
/* ------------------------------------------------------------------ *
 * The named operation.
 * ------------------------------------------------------------------ */
/** C-OPS-PORTAL-005 — POST /api/ops/schools/{documentId}/suspend (versioned). */
exports.SchoolSuspendOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-005',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/suspend',
    request: exports.schoolSuspendBodySchema,
    response: (0, core_1.dataEnvelope)(exports.schoolSuspendResultSchema),
    success: 200,
    errors: [400, 401, 403, 404, 412, 429, 500],
});
