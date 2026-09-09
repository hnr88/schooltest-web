"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipTransferOperation = exports.ownershipTransferResponseSchema = exports.ownershipTransferResultSchema = exports.ownershipTransferBodySchema = exports.OWNERSHIP_TRANSFER_CODES = exports.accessModelSchema = void 0;
/**
 * D-OWN — managed-admins access mode and the single-owner rule (backlog task 01).
 *
 * The HTML multi-admin table with its "Make owner" action is a settled decision
 * (mvp/tasks/ops/decisions.md D-OWN): the school gains an explicit owner
 * relation plus a `managed_admins` access mode, while EVERY legacy caller that
 * omits portal version/access model keeps the current single-admin rule.
 *
 * Rules this module pins, so no downstream task re-opens them:
 *  - The owner is an accepted, active, same-school school_admin — never a
 *    teacher, never a blocked account, never an open invitation.
 *  - EXACTLY ONE owner at a time. The deterministic backfill (migration
 *    2026.09.05T02.01.00.owner-backfill.js) names an owner ONLY where the
 *    school has exactly one active school_admin; ambiguous legacy ownership is
 *    left NULL and requires an explicit ops selection — never a guess.
 *  - Removing an owner requires the transfer first: the last active admin
 *    cannot be removed (`school/services/staff.ts` assertNotLastAdmin guards
 *    it today and stays authoritative).
 *  - `expected_owner_documentId` makes the transfer an optimistic write: the
 *    caller quotes the owner it saw, and a concurrent transfer 409s instead of
 *    silently winning.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
/** How the school manages its admins. Legacy callers keep single_admin. */
exports.accessModelSchema = zod_1.z.enum(['single_admin', 'managed_admins']);
/**
 * Stable `details.code` values for the transfer. The HTTP status alone cannot
 * separate the two ways a transfer legitimately fails, so the client gets a
 * code rather than having to match on prose:
 *
 *  - `expectedOwnerStale` is the 409 a CONCURRENT transfer produces. The caller
 *    quoted the owner it saw and the school has moved on since, so the correct
 *    client behaviour is refetch-and-reconfirm, never retry-as-is.
 *  - `targetNotEligible` is the 400 for a target that is not an accepted,
 *    unblocked school_admin of that school.
 *  - `ownerUnset` marks a school whose ownership the backfill left ambiguous.
 *    It is NOT an error condition on its own — it is the state a caller quotes
 *    as `expected_owner_documentId: null`, and the UI must make ops choose
 *    explicitly rather than guessing an owner for them.
 */
exports.OWNERSHIP_TRANSFER_CODES = {
    expectedOwnerStale: 'OWNER_EXPECTED_STALE',
    targetNotEligible: 'OWNER_TARGET_NOT_ELIGIBLE',
    ownerUnset: 'OWNER_UNSET',
};
/** POST /api/ops/schools/{documentId}/owner — the body (strict). */
exports.ownershipTransferBodySchema = zod_1.z.strictObject({
    owner_documentId: core_1.documentIdSchema,
    /** Optimistic guard: the owner the caller saw. null means "expect no owner". */
    expected_owner_documentId: core_1.documentIdSchema.nullable(),
});
/** 200 body. */
exports.ownershipTransferResultSchema = zod_1.z.strictObject({
    school_documentId: core_1.documentIdSchema,
    owner_documentId: core_1.documentIdSchema,
    previous_owner_documentId: core_1.documentIdSchema.nullable(),
});
exports.ownershipTransferResponseSchema = (0, core_1.dataEnvelope)(exports.ownershipTransferResultSchema);
/** C-OPS-PORTAL-027 — POST /api/ops/schools/{documentId}/owner */
exports.OwnershipTransferOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-027',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/owner',
    request: exports.ownershipTransferBodySchema,
    response: exports.ownershipTransferResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
