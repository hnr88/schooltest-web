/**
 * OPS-038 / C-OPS-PORTAL-028 — GET /api/ops/schools/{documentId}/classes.
 *
 * ONE definition of the ops Classes-tab list, imported by the server contract
 * suite and by schooltest-web's typed client, so the row a controller projects
 * and the row a table renders can never drift apart.
 *
 * Two decisions this file encodes, because both are easy to reimplement
 * differently on each side:
 *
 *  - STATUS IS DERIVED, NEVER STORED. The wire row carries no `status` key. A
 *    class is `archived` when `archived_at` is set (that column arrives with
 *    the archive task; until then the server projects null for every row),
 *    otherwise `pending_setup` when it has no primary teacher, otherwise
 *    `active`. `classRowStatus` is the single implementation — the server
 *    filters `?status=` through it and the UI paints its pill from it.
 *
 *  - CO-TEACHERS COUNT. `teachers` is the many-to-many membership and
 *    `primary_teacher` the singular owning teacher that the teacher-scoped
 *    reads use. `?teacher=` matches EITHER, so a co-taught class is not lost
 *    from a teacher's filtered list.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** Strapi serialises every datetime as an ISO-8601 instant. */
export declare const timestampSchema: z.ZodISODateTime;
/** The three states the Classes tab's filter chips select between. */
export declare const classListStatusSchema: z.ZodEnum<{
    active: "active";
    pending_setup: "pending_setup";
    archived: "archived";
}>;
export type ClassListStatus = z.infer<typeof classListStatusSchema>;
/** The two orderings the tab offers; anything else is a 400 server-side. */
export declare const classListSortSchema: z.ZodEnum<{
    "name:asc": "name:asc";
    "student_count:desc": "student_count:desc";
}>;
export type ClassListSort = z.infer<typeof classListSortSchema>;
export declare const classTeacherRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ClassTeacherRef = z.infer<typeof classTeacherRefSchema>;
export declare const classSchoolRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ClassSchoolRef = z.infer<typeof classSchoolRefSchema>;
/**
 * The school's live form window, echoed on every class of that school. The
 * product stores ONE window per school (api::form-window, replace semantics),
 * so this is the real window a class's students sit — not a per-class field
 * invented to fill the design's `{year} · {window}` subtitle.
 */
export declare const classTestWindowSchema: z.ZodObject<{
    documentId: z.ZodString;
    title: z.ZodString;
    opens_at: z.ZodISODateTime;
    closes_at: z.ZodISODateTime;
}, z.core.$strict>;
export type ClassTestWindow = z.infer<typeof classTestWindowSchema>;
export declare const classRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    year_band: z.ZodNullable<z.ZodString>;
    teachers: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    student_count: z.ZodNumber;
    archived_at: z.ZodNullable<z.ZodISODateTime>;
    school: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    primary_teacher: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    updatedAt: z.ZodISODateTime;
    test_window: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        title: z.ZodString;
        opens_at: z.ZodISODateTime;
        closes_at: z.ZodISODateTime;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ClassRow = z.infer<typeof classRowSchema>;
export declare const classesListPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type ClassesListPagination = z.infer<typeof classesListPaginationSchema>;
/**
 * The accepted query string. Strict: an unknown key is a caller mistake, and
 * silently ignoring it would hand back an unfiltered page that looks filtered.
 */
export declare const classesListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        pending_setup: "pending_setup";
        archived: "archived";
    }>>;
    teacher: z.ZodOptional<z.ZodString>;
    year_band: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<{
        "name:asc": "name:asc";
        "student_count:desc": "student_count:desc";
    }>>;
}, z.core.$strict>;
export type ClassesListQuery = z.infer<typeof classesListQuerySchema>;
/** 200 body — `{ data, meta }`, unlike the single-object `{ data }` envelope. */
export declare const classesListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        year_band: z.ZodNullable<z.ZodString>;
        teachers: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        student_count: z.ZodNumber;
        archived_at: z.ZodNullable<z.ZodISODateTime>;
        school: z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>;
        primary_teacher: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        updatedAt: z.ZodISODateTime;
        test_window: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            title: z.ZodString;
            opens_at: z.ZodISODateTime;
            closes_at: z.ZodISODateTime;
        }, z.core.$strict>>;
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
export type ClassesListResponse = z.infer<typeof classesListResponseSchema>;
/** The empty request body: this operation is a GET and accepts none. */
export declare const classesListRequestSchema: z.ZodObject<{}, z.core.$strict>;
/**
 * THE status rule, in one place. `archived_at` wins outright; a class with no
 * primary teacher is still being set up; everything else is active.
 */
export declare function classRowStatus(row: Pick<ClassRow, 'archived_at' | 'primary_teacher'>): ClassListStatus;
/**
 * Build the query string for one request. Kept here rather than in the web
 * client so the keys the server parses and the keys the client sends are the
 * same literals. Undefined/empty values are dropped, never sent as "".
 */
export declare function classesListQueryParams(query: ClassesListQuery): Record<string, string>;
/** Path of the operation for one school. */
export declare function classesListPath(schoolDocumentId: string): string;
/**
 * C-OPS-PORTAL-028. `response` is the full `{ data, meta }` body; the plain
 * `dataEnvelope` is re-used only for the row-level assertions a caller may
 * want, so the shared helper stays the one envelope definition.
 */
export declare const ClassesListOperation: OpsOperation<typeof classesListRequestSchema, typeof classesListResponseSchema>;
/** `{ data: ClassRow }` — used when a single row is read back for assertions. */
export declare const classRowEnvelopeSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        year_band: z.ZodNullable<z.ZodString>;
        teachers: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        student_count: z.ZodNumber;
        archived_at: z.ZodNullable<z.ZodISODateTime>;
        school: z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>;
        primary_teacher: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        updatedAt: z.ZodISODateTime;
        test_window: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            title: z.ZodString;
            opens_at: z.ZodISODateTime;
            closes_at: z.ZodISODateTime;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare const classCreateBodySchema: z.ZodObject<{
    name: z.ZodString;
    year_band: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type ClassCreateBody = z.infer<typeof classCreateBodySchema>;
/** The PARTIAL row `opsCreateClass` actually projects — see the block comment above. */
export declare const classCreateRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    year_band: z.ZodNullable<z.ZodString>;
    teachers: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    student_count: z.ZodNumber;
}, z.core.$strict>;
export type ClassCreateRow = z.infer<typeof classCreateRowSchema>;
export declare const classCreateResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        year_band: z.ZodNullable<z.ZodString>;
        teachers: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        student_count: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare const ClassCreateOperation: OpsOperation<typeof classCreateBodySchema, typeof classCreateResponseSchema>;
/**
 * Both writes take an EMPTY body. Which operation it is comes from the path,
 * never from a payload key, and the strict object means a caller cannot smuggle
 * `archived_at` — or a school/class reference — past the route scope. Restore
 * reuses this schema rather than restating it: one empty-body definition for
 * the pair, so the two cannot drift apart.
 */
export declare const classArchiveBodySchema: z.ZodObject<{}, z.core.$strict>;
export type ClassArchiveBody = z.infer<typeof classArchiveBodySchema>;
/**
 * C-OPS-CLASS-ARCHIVE. 200 with `archived_at` set. No `student.class` link is
 * touched (D-18): the roster survives the archive, and the row reads `archived`
 * from the timestamp alone.
 *
 * `errors` is the contract record's list verbatim — [400, 401, 403, 404, 409].
 * It is deliberately shorter than the read operations' list above: the record
 * is the signature (RUN.md law 4), so the codes are not widened here to match
 * a sibling.
 */
export declare const ClassArchiveOperation: OpsOperation<typeof classArchiveBodySchema, typeof classRowEnvelopeSchema>;
/**
 * C-OPS-CLASS-RESTORE. 200 with `archived_at` cleared to null. A restored class
 * returns to `active` or `pending_setup` purely by derivation — there is no
 * stored status to reconcile, which is why restore needs no body either.
 */
export declare const ClassRestoreOperation: OpsOperation<typeof classArchiveBodySchema, typeof classRowEnvelopeSchema>;
