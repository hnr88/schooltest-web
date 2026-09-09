/**
 * C-OPS-PORTAL-035 — GET /api/ops/schools/{documentId}/students (OPS-045).
 *
 * ONE definition of the ops Students tab wire shape, imported by the Strapi
 * projection, by the typed web query and by the HTTP assertions on both sides.
 * Pure Zod + TypeScript: nothing here may import Strapi, Next or node built-ins.
 *
 * Two scales are deliberately kept APART on this row and must never be mixed:
 *  - `acara_phase` is the student's stored ACARA proficiency phase
 *    (beginning|emerging|developing|consolidating) — a PROFILE attribute.
 *  - `latest_result.cefr_level` is the CEFR band COMPUTED by the crosswalk for
 *    the student's latest official, complete, non-invalidated skill result.
 * An ACARA label is never converted into a CEFR string (and vice versa): a row
 * can carry one, both or neither, and each is emitted from its own source.
 *
 * `latest_result` is null when the student has no qualifying official result at
 * all (never a zero-valued stand-in), while `percentage: 0` is a REAL score
 * and must survive every projection, parse and render untouched.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** api::student.student `status` enum, stored verbatim. `enrolled` is the
 *  roster row that has not finished setup; the UI labels it "Pending setup"
 *  but the wire value is never renamed. */
export declare const OPS_STUDENT_STATUSES: readonly ["active", "archived", "enrolled"];
export declare const opsStudentStatusSchema: z.ZodEnum<{
    active: "active";
    archived: "archived";
    enrolled: "enrolled";
}>;
export type OpsStudentStatus = z.infer<typeof opsStudentStatusSchema>;
/** api::student.student `acara_phase` enum. */
export declare const OPS_ACARA_PHASES: readonly ["beginning", "emerging", "developing", "consolidating"];
export declare const opsAcaraPhaseSchema: z.ZodEnum<{
    emerging: "emerging";
    beginning: "beginning";
    developing: "developing";
    consolidating: "consolidating";
}>;
export type OpsAcaraPhase = z.infer<typeof opsAcaraPhaseSchema>;
export declare const OPS_STUDENT_YEAR_LEVEL_MIN = 7;
export declare const OPS_STUDENT_YEAR_LEVEL_MAX = 12;
export declare const OPS_STUDENTS_PAGE_MAX = 100000;
export declare const OPS_STUDENTS_PAGE_SIZE_DEFAULT = 25;
export declare const OPS_STUDENTS_PAGE_SIZE_MAX = 200;
export declare const OPS_STUDENTS_QUERY_MAX = 120;
export declare const opsStudentClassRefSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type OpsStudentClassRef = z.infer<typeof opsStudentClassRefSchema>;
/**
 * The student's latest OFFICIAL, complete, non-invalidated skill result.
 * `cefr_level` is the stored crosswalk band (null while a result carries none)
 * and `percentage` is the proportion-correct score of that sitting rescaled to
 * 0..100 — null when the sitting has no server-scored evidence yet, and 0 when
 * the student genuinely scored nothing.
 */
export declare const opsStudentLatestResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    cefr_level: z.ZodNullable<z.ZodString>;
    percentage: z.ZodNullable<z.ZodNumber>;
    completed_at: z.ZodISODateTime;
}, z.core.$strict>;
export type OpsStudentLatestResult = z.infer<typeof opsStudentLatestResultSchema>;
export declare const opsStudentRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    given_name: z.ZodString;
    family_name: z.ZodNullable<z.ZodString>;
    year_level: z.ZodNullable<z.ZodNumber>;
    first_language: z.ZodNullable<z.ZodString>;
    acara_phase: z.ZodNullable<z.ZodEnum<{
        emerging: "emerging";
        beginning: "beginning";
        developing: "developing";
        consolidating: "consolidating";
    }>>;
    status: z.ZodEnum<{
        active: "active";
        archived: "archived";
        enrolled: "enrolled";
    }>;
    class: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    latest_result: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        cefr_level: z.ZodNullable<z.ZodString>;
        percentage: z.ZodNullable<z.ZodNumber>;
        completed_at: z.ZodISODateTime;
    }, z.core.$strict>>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type OpsStudentRow = z.infer<typeof opsStudentRowSchema>;
export declare const opsStudentsPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
export type OpsStudentsPagination = z.infer<typeof opsStudentsPaginationSchema>;
/**
 * The decoded query. HTTP delivers strings; `page`, `pageSize` and `year_level`
 * decode ONCE to integers here, so a value outside the bounds is a 400 rather
 * than a silent clamp. `class` must be a class of the school in the path.
 */
export declare const opsStudentsListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        enrolled: "enrolled";
    }>>;
    class: z.ZodOptional<z.ZodString>;
    year_level: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type OpsStudentsListQuery = z.infer<typeof opsStudentsListQuerySchema>;
export declare const opsStudentsListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        given_name: z.ZodString;
        family_name: z.ZodNullable<z.ZodString>;
        year_level: z.ZodNullable<z.ZodNumber>;
        first_language: z.ZodNullable<z.ZodString>;
        acara_phase: z.ZodNullable<z.ZodEnum<{
            emerging: "emerging";
            beginning: "beginning";
            developing: "developing";
            consolidating: "consolidating";
        }>>;
        status: z.ZodEnum<{
            active: "active";
            archived: "archived";
            enrolled: "enrolled";
        }>;
        class: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        latest_result: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            cefr_level: z.ZodNullable<z.ZodString>;
            percentage: z.ZodNullable<z.ZodNumber>;
            completed_at: z.ZodISODateTime;
        }, z.core.$strict>>;
        updatedAt: z.ZodISODateTime;
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
export type OpsStudentsListResponse = z.infer<typeof opsStudentsListResponseSchema>;
/**
 * The one encoder for this operation's query — client and tests share it, so an
 * omitted filter is an ABSENT key rather than an empty value, and no caller
 * invents a second spelling of `year_level`. Written with plain string pairs
 * (no URLSearchParams) because this package targets ES2020 with no DOM/node lib.
 */
export declare function opsStudentsListQueryString(query: OpsStudentsListQuery): string;
/** `/api/ops/schools/{documentId}/students` with the encoded query appended. */
export declare function opsStudentsListPath(schoolDocumentId: string, query?: OpsStudentsListQuery): string;
export declare const StudentsListOperation: OpsOperation<typeof opsStudentsListQuerySchema, typeof opsStudentsListResponseSchema>;
