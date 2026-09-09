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
import { z } from 'zod';
import { type OpsOperation } from './core';
/** How the school manages its admins. Legacy callers keep single_admin. */
export declare const accessModelSchema: z.ZodEnum<{
    single_admin: "single_admin";
    managed_admins: "managed_admins";
}>;
export type AccessModel = z.infer<typeof accessModelSchema>;
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
export declare const OWNERSHIP_TRANSFER_CODES: {
    readonly expectedOwnerStale: "OWNER_EXPECTED_STALE";
    readonly targetNotEligible: "OWNER_TARGET_NOT_ELIGIBLE";
    readonly ownerUnset: "OWNER_UNSET";
};
export type OwnershipTransferCode = (typeof OWNERSHIP_TRANSFER_CODES)[keyof typeof OWNERSHIP_TRANSFER_CODES];
/** POST /api/ops/schools/{documentId}/owner — the body (strict). */
export declare const ownershipTransferBodySchema: z.ZodObject<{
    owner_documentId: z.ZodString;
    expected_owner_documentId: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type OwnershipTransferBody = z.infer<typeof ownershipTransferBodySchema>;
/** 200 body. */
export declare const ownershipTransferResultSchema: z.ZodObject<{
    school_documentId: z.ZodString;
    owner_documentId: z.ZodString;
    previous_owner_documentId: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type OwnershipTransferResult = z.infer<typeof ownershipTransferResultSchema>;
export declare const ownershipTransferResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        school_documentId: z.ZodString;
        owner_documentId: z.ZodString;
        previous_owner_documentId: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OwnershipTransferResponse = z.infer<typeof ownershipTransferResponseSchema>;
/** C-OPS-PORTAL-027 — POST /api/ops/schools/{documentId}/owner */
export declare const OwnershipTransferOperation: OpsOperation<typeof ownershipTransferBodySchema, typeof ownershipTransferResponseSchema>;
