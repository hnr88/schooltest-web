/**
 * OPS-025 — C-OPS-PORTAL-015 `GET /api/ops/users`.
 *
 * ONE definition of the staff directory read, imported by the Strapi
 * projection, the typed web query and both HTTP suites, so the Admins and
 * Teachers surfaces cannot drift from the server that feeds them.
 *
 * Two shapes live here on purpose:
 *  - `legacyStaffUserRowSchema` is the EXACT unversioned row the endpoint has
 *    served since C-OPSU-01. A caller that omits `X-Ops-Portal-Version` keeps
 *    it byte for byte (D-COMPAT), so this file is also the regression fence.
 *  - `staffUserRowSchema` is the versioned portal row: the legacy keys plus
 *    `updatedAt`, `display_name`, `teaching_specialty` and `last_active_at`.
 *
 * `last_active_at` is a REAL authenticated-login timestamp (up_users
 * `last_active_at`, stamped by the login wrap). It is null for every account
 * that has not signed in since the column existed — never derived from
 * `createdAt`, which would manufacture history the system never observed.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const PAGE_MIN = 1;
export declare const PAGE_MAX = 100000;
export declare const PAGE_SIZE_MIN = 1;
export declare const PAGE_SIZE_DEFAULT = 25;
export declare const PAGE_SIZE_MAX = 200;
/**
 * The portal role vocabulary. `ops_support` is contracted but has no seeded
 * users-permissions role on this stack yet, so filtering by it legitimately
 * returns zero rows — it never widens what a caller may read.
 */
export declare const STAFF_USER_ROLES: readonly ["ops", "school_admin", "teacher", "parent", "student", "ops_support"];
export declare const staffUserRoleSchema: z.ZodEnum<{
    ops: "ops";
    ops_support: "ops_support";
    teacher: "teacher";
    school_admin: "school_admin";
    parent: "parent";
    student: "student";
}>;
export type StaffUserRole = z.infer<typeof staffUserRoleSchema>;
/** The five roles the UNVERSIONED endpoint has always accepted in `?role=`. */
export declare const LEGACY_STAFF_USER_ROLES: readonly ["ops", "school_admin", "teacher", "parent", "student"];
export type LegacyStaffUserRole = (typeof LEGACY_STAFF_USER_ROLES)[number];
export declare const staffPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type StaffPagination = z.infer<typeof staffPaginationSchema>;
export declare const staffSchoolRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type StaffSchoolRef = z.infer<typeof staffSchoolRefSchema>;
/** The unversioned projection — ten keys, unchanged since C-OPSU-01. */
export declare const legacyStaffUserRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    username: z.ZodNullable<z.ZodString>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNullable<z.ZodString>;
    blocked: z.ZodBoolean;
    confirmed: z.ZodBoolean;
    school: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    createdAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type LegacyStaffUserRow = z.infer<typeof legacyStaffUserRowSchema>;
/** The versioned portal projection. Every key is always present, nulls included. */
export declare const staffUserRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    username: z.ZodNullable<z.ZodString>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNullable<z.ZodEnum<{
        ops: "ops";
        ops_support: "ops_support";
        teacher: "teacher";
        school_admin: "school_admin";
        parent: "parent";
        student: "student";
    }>>;
    blocked: z.ZodBoolean;
    confirmed: z.ZodBoolean;
    school: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    createdAt: z.ZodNullable<z.ZodISODateTime>;
    updatedAt: z.ZodISODateTime;
    display_name: z.ZodNullable<z.ZodString>;
    teaching_specialty: z.ZodNullable<z.ZodString>;
    last_active_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type StaffUserRow = z.infer<typeof staffUserRowSchema>;
export declare const staffUsersQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    school: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        ops: "ops";
        ops_support: "ops_support";
        teacher: "teacher";
        school_admin: "school_admin";
        parent: "parent";
        student: "student";
    }>>;
    blocked: z.ZodOptional<z.ZodBoolean>;
    confirmed: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type StaffUsersQuery = z.infer<typeof staffUsersQuerySchema>;
export declare const staffUsersResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
        username: z.ZodNullable<z.ZodString>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        role: z.ZodNullable<z.ZodEnum<{
            ops: "ops";
            ops_support: "ops_support";
            teacher: "teacher";
            school_admin: "school_admin";
            parent: "parent";
            student: "student";
        }>>;
        blocked: z.ZodBoolean;
        confirmed: z.ZodBoolean;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        createdAt: z.ZodNullable<z.ZodISODateTime>;
        updatedAt: z.ZodISODateTime;
        display_name: z.ZodNullable<z.ZodString>;
        teaching_specialty: z.ZodNullable<z.ZodString>;
        last_active_at: z.ZodNullable<z.ZodISODateTime>;
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
export type StaffUsersResponse = z.infer<typeof staffUsersResponseSchema>;
export declare const legacyStaffUsersResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
        username: z.ZodNullable<z.ZodString>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        role: z.ZodNullable<z.ZodString>;
        blocked: z.ZodBoolean;
        confirmed: z.ZodBoolean;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        createdAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const StaffUsersOperation: OpsOperation<typeof staffUsersQuerySchema, typeof staffUsersResponseSchema>;
export declare const STAFF_ROW_KINDS: readonly ["user", "invitation"];
export declare const staffRowKindSchema: z.ZodEnum<{
    user: "user";
    invitation: "invitation";
}>;
export type StaffRowKind = z.infer<typeof staffRowKindSchema>;
export interface StaffRowIdentity {
    kind: StaffRowKind;
    documentId: string;
}
export declare function staffRowId(identity: StaffRowIdentity): string;
export declare function parseStaffRowId(value: string): StaffRowIdentity | null;
/**
 * The single pictured name input, rebuilt losslessly from the stored parts.
 * Returns null rather than an empty string when the account has neither name,
 * so the caller renders its own no-value fallback instead of a blank cell.
 */
export declare function staffDisplayName(parts: {
    first_name: string | null;
    last_name: string | null;
}): string | null;
/**
 * The inverse of `staffDisplayName`: what the single pictured Name control
 * stores.
 *
 * The whole typed string goes into `first_name` and `last_name` is emptied.
 * That is lossless rather than lazy — `staffDisplayName` joins the two parts
 * and drops the empty one, so the exact string the operator typed comes back.
 * The alternative is splitting on a space to guess which word is the surname,
 * which D-NAME forbids ("Do not guess surnames") and which silently renames
 * real people: "van der Berg" and "Maria Teresa" both lose.
 *
 * The cap is the SAME constant the join applies, so a stored name can never be
 * longer than what the read side is willing to render — otherwise the value
 * would round-trip truncated and the control would not be lossless after all.
 *
 * Defined here, beside its inverse, because an invitation and an account are
 * the same person at two moments: the invite parser and the account editor
 * must not each keep their own idea of how a name is stored.
 */
export declare function splitStaffDisplayName(displayName: string): {
    first_name: string;
    last_name: string;
};
