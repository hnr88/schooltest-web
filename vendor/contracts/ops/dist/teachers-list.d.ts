/**
 * C-OPS-PORTAL-021 — `GET /api/ops/schools/{documentId}/teachers` (OPS-031).
 *
 * ONE portable definition of the ops staff-directory read, imported by the
 * Strapi handler that serves it, by the web client that consumes it and by the
 * Playwright suites on both sides, so the wire shape cannot drift.
 *
 * TWO contracts live behind one path, selected by the D-COMPAT version header
 * and nothing else (the header carries no authority — see ./compatibility):
 *
 *  - LEGACY (no `X-Ops-Portal-Version`) — `teachersLegacyRowSchema[]` inside a
 *    bare `{ data }`. This is the OBSERVED baseline the existing ops teacher
 *    dialog already receives: the COMPLETE array (never paginated), staff of
 *    both `teacher` and `school_admin` role, and `classes` grouped by the
 *    LEGACY PRIMARY teacher relation ONLY (`class.teacher`). Preserved keystroke
 *    for keystroke; a new key here would break a shipped consumer.
 *
 *  - VERSIONED (`X-Ops-Portal-Version: 1`) — `teachersListResponseSchema`:
 *    `{ data: teacherPortalRowSchema[], meta: { pagination } }` with the `q`,
 *    `role` and `blocked` filters applied IN THE QUERY (so a search reaches
 *    every eligible candidate instead of filtering one truncated page), and the
 *    class membership RECONCILED once — see `mergeTeacherClassRefs`.
 *
 * CLASS-MEMBERSHIP COUNTS, stated once so no reader has to guess:
 *  - `class.teacher`  (manyToOne)   = the PRIMARY teacher of the class. Exactly
 *    one per class, and the only membership the legacy projection counts.
 *  - `class.teachers` (manyToMany)  = CO-TEACHERS. Zero or more per class.
 *  - `teacherPortalRow.classes`     = the UNION of both, de-duplicated by
 *    `documentId`. A teacher who is both primary and co-teacher of the same
 *    class appears ONCE. So `classes.length` is "classes this teacher is
 *    attached to in any capacity" — it is NOT a count of classes they own, and
 *    summing it across teachers double-counts co-taught classes.
 *
 * Every object is strict: a key the contract never promised fails the parse
 * instead of being silently accepted inbound or leaked outbound.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** ISO-8601 instant exactly as Strapi serialises a timestamp column. */
export declare const opsTimestampSchema: z.ZodISODateTime;
/**
 * A class a teacher is attached to. `name` is nullable and is NEVER an
 * identity: the relation is keyed on `documentId`, so two classes that share a
 * label stay distinguishable.
 */
export declare const teacherClassRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type TeacherClassRef = z.infer<typeof teacherClassRefSchema>;
/** The unversioned row, frozen as observed. Six keys, primary classes only. */
export declare const teachersLegacyRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    blocked: z.ZodBoolean;
    classes: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type TeachersLegacyRow = z.infer<typeof teachersLegacyRowSchema>;
/**
 * The versioned row. Adds the four portal fields on top of the legacy six:
 *  - `updatedAt`          — the row's own Strapi timestamp, for optimistic UI.
 *  - `display_name`       — a LABEL built from the stored names. Presentation
 *                           only; never a key, never a lookup value.
 *  - `teaching_specialty` — the stored specialty, `null` when the account has
 *                           none recorded. Never inferred from a name.
 *  - `last_active_at`     — the newest authenticated-session fact recorded for
 *                           this teacher, `null` when none exists. Never
 *                           substituted with `createdAt`.
 */
export declare const teacherPortalRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    blocked: z.ZodBoolean;
    classes: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    updatedAt: z.ZodISODateTime;
    display_name: z.ZodNullable<z.ZodString>;
    teaching_specialty: z.ZodNullable<z.ZodString>;
    last_active_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type TeacherPortalRow = z.infer<typeof teacherPortalRowSchema>;
export declare const teachersListPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type TeachersListPagination = z.infer<typeof teachersListPaginationSchema>;
/** The staff roles this directory serves. Never widened by a query param. */
export declare const teacherRoleSchema: z.ZodEnum<{
    teacher: "teacher";
    school_admin: "school_admin";
}>;
export type TeacherRoleFilter = z.infer<typeof teacherRoleSchema>;
/**
 * The versioned query string, post-coercion. The server parses the raw strings
 * itself (an out-of-range page is a 400, never a silent clamp) and validates
 * the parsed result against this schema before any business logic runs.
 */
export declare const teachersListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        teacher: "teacher";
        school_admin: "school_admin";
    }>>;
    blocked: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type TeachersListQuery = z.infer<typeof teachersListQuerySchema>;
export declare const teachersListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        blocked: z.ZodBoolean;
        classes: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
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
export type TeachersListResponse = z.infer<typeof teachersListResponseSchema>;
/** The legacy body: a bare `{ data }` with the complete, unpaginated array. */
export declare const teachersLegacyResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        email: z.ZodNullable<z.ZodString>;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        blocked: z.ZodBoolean;
        classes: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type TeachersLegacyResponse = z.infer<typeof teachersLegacyResponseSchema>;
/**
 * The ONE reconciliation of the two class relations, shared by the server that
 * projects it and the tests that assert it, so "which classes is this teacher
 * on" has a single answer.
 *
 * Union of primary and co-teacher membership, de-duplicated by `documentId`
 * (first occurrence wins, so a primary row keeps its name), then ordered by
 * `name` and tie-broken on `documentId` — never on the display label alone,
 * which is not unique.
 */
export declare function mergeTeacherClassRefs(primary: readonly TeacherClassRef[], coTeaching: readonly TeacherClassRef[]): TeacherClassRef[];
/**
 * A presentation label built from the stored names. Returns `null` — never the
 * email, never invented text — when no name is stored, so the UI renders its
 * own empty fallback instead of guessing one.
 */
export declare function teacherDisplayName(firstName: string | null, lastName: string | null): string | null;
/** C-OPS-PORTAL-021 — GET /api/ops/schools/{documentId}/teachers */
export declare const TeachersListOperation: OpsOperation<typeof teachersListQuerySchema, typeof teachersListResponseSchema>;
