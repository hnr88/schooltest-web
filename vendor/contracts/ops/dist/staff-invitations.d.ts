/**
 * OPS-026 — C-OPS-PORTAL-016 `GET /api/ops/invitations`.
 *
 * ONE definition of the staff-invitation read, imported by the Strapi
 * projection tests and by the web query hook, so the pending-invitation row can
 * not drift between the two sides.
 *
 * Three properties this module exists to pin:
 *  - A list row NEVER carries `token`. The strict object rejects it on the way
 *    out, so a projection that leaks the invitation secret fails the parse
 *    instead of shipping a working invite link into a directory response.
 *  - `invited_at` is the invitation's real creation instant. `expires_at` is a
 *    DIFFERENT fact (creation + TTL) and must never stand in for it — the
 *    pictured "Invited N days ago" subtitle would then be off by the whole TTL.
 *  - `status` is evaluated against server time: a row still stored `invited`
 *    whose `expires_at` has passed reads `expired`. Storage is not rewritten by
 *    a read; the derivation lives here so filter and projection agree.
 *
 * The unversioned baseline (no X-Ops-Portal-Version header) keeps exactly the
 * nine keys it serves today — `legacyStaffInvitationRowSchema` is that shape,
 * derived from this one rather than restated, so the two cannot drift either.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const staffInvitationRoleSchema: z.ZodEnum<{
    teacher: "teacher";
    school_admin: "school_admin";
}>;
export type StaffInvitationRole = z.infer<typeof staffInvitationRoleSchema>;
export declare const staffInvitationStatusSchema: z.ZodEnum<{
    invited: "invited";
    revoked: "revoked";
    accepted: "accepted";
    expired: "expired";
}>;
export type StaffInvitationStatus = z.infer<typeof staffInvitationStatusSchema>;
export declare const staffInvitationSchoolRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type StaffInvitationSchoolRef = z.infer<typeof staffInvitationSchoolRefSchema>;
/**
 * The portal row. `role`/`status` are nullable because the stored enum can be
 * absent on an old row, and an unknown role must surface as null rather than be
 * guessed into `teacher`.
 */
export declare const staffInvitationRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNullable<z.ZodEnum<{
        teacher: "teacher";
        school_admin: "school_admin";
    }>>;
    status: z.ZodNullable<z.ZodEnum<{
        invited: "invited";
        revoked: "revoked";
        accepted: "accepted";
        expired: "expired";
    }>>;
    expires_at: z.ZodNullable<z.ZodISODateTime>;
    accepted_at: z.ZodNullable<z.ZodISODateTime>;
    revoked_at: z.ZodNullable<z.ZodISODateTime>;
    school: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    display_name: z.ZodNullable<z.ZodString>;
    invited_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type StaffInvitationRow = z.infer<typeof staffInvitationRowSchema>;
/** The observed pre-portal shape: the same row WITHOUT the two portal keys. */
export declare const legacyStaffInvitationRowSchema: z.ZodObject<{
    status: z.ZodNullable<z.ZodEnum<{
        invited: "invited";
        revoked: "revoked";
        accepted: "accepted";
        expired: "expired";
    }>>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    expires_at: z.ZodNullable<z.ZodISODateTime>;
    documentId: z.ZodString;
    role: z.ZodNullable<z.ZodEnum<{
        teacher: "teacher";
        school_admin: "school_admin";
    }>>;
    school: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    accepted_at: z.ZodNullable<z.ZodISODateTime>;
    revoked_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type LegacyStaffInvitationRow = z.infer<typeof legacyStaffInvitationRowSchema>;
export declare const staffInvitationsPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type StaffInvitationsPagination = z.infer<typeof staffInvitationsPaginationSchema>;
export declare const staffInvitationsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        role: z.ZodNullable<z.ZodEnum<{
            teacher: "teacher";
            school_admin: "school_admin";
        }>>;
        status: z.ZodNullable<z.ZodEnum<{
            invited: "invited";
            revoked: "revoked";
            accepted: "accepted";
            expired: "expired";
        }>>;
        expires_at: z.ZodNullable<z.ZodISODateTime>;
        accepted_at: z.ZodNullable<z.ZodISODateTime>;
        revoked_at: z.ZodNullable<z.ZodISODateTime>;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        display_name: z.ZodNullable<z.ZodString>;
        invited_at: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type StaffInvitationsResponse = z.infer<typeof staffInvitationsResponseSchema>;
export declare const legacyStaffInvitationsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        status: z.ZodNullable<z.ZodEnum<{
            invited: "invited";
            revoked: "revoked";
            accepted: "accepted";
            expired: "expired";
        }>>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        expires_at: z.ZodNullable<z.ZodISODateTime>;
        documentId: z.ZodString;
        role: z.ZodNullable<z.ZodEnum<{
            teacher: "teacher";
            school_admin: "school_admin";
        }>>;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        accepted_at: z.ZodNullable<z.ZodISODateTime>;
        revoked_at: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strict>;
}, z.core.$strict>;
/**
 * The query string, decoded. HTTP delivers strings; the server decodes once and
 * validates against this, so `pageSize=0`, `role=owner` or `page=1.5` are 400s
 * rather than a silent clamp that hides how much data the operator did not see.
 */
export declare const staffInvitationsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    school: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        teacher: "teacher";
        school_admin: "school_admin";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        invited: "invited";
        revoked: "revoked";
        accepted: "accepted";
        expired: "expired";
    }>>;
}, z.core.$strict>;
export type StaffInvitationsQuery = z.infer<typeof staffInvitationsQuerySchema>;
/**
 * Expiry is a fact about the clock, not about the stored row: only a pending
 * `invited` row can become `expired`, and only once `expires_at` is at or
 * behind server time. `accepted` and `revoked` are terminal and never reopen.
 */
export declare function resolveStaffInvitationStatus(stored: StaffInvitationStatus | null, expiresAt: string | null, nowMs: number): StaffInvitationStatus | null;
/**
 * The single pictured name input, preserved losslessly. An invitation may carry
 * no usable name at all — that is null, never the email address and never a
 * surname guessed out of one half of the pair.
 */
export declare function staffInvitationDisplayName(firstName: string | null, lastName: string | null): string | null;
/**
 * Whole days between the invitation's creation and now, for the "Invited N days
 * ago" subtitle. Null when the row has no creation instant (an old row written
 * before the column existed) so the UI can say "unknown" instead of "0 days".
 * A future timestamp clamps to 0 rather than rendering a negative age.
 */
export declare function staffInvitationInvitedDaysAgo(invitedAt: string | null, nowMs: number): number | null;
/**
 * An ACCEPTED invitation is not a second person: the staff user account created
 * by acceptance is the active identity, and rendering both would double every
 * accepted admin/teacher in the pictured tab. The invitation row stays readable
 * as history; it just never counts as an active person.
 */
export declare function staffInvitationHasUserAccount(status: StaffInvitationStatus | null): boolean;
/** C-OPS-PORTAL-016 — GET /api/ops/invitations */
export declare const StaffInvitationsOperation: OpsOperation<typeof staffInvitationsQuerySchema, typeof staffInvitationsResponseSchema>;
