/**
 * C-OPS-PORTAL-037 — GET /api/ops/schools/{schoolDocumentId}/classes/{classDocumentId}/students
 * (the paginated roster read, backlog task 01).
 *
 * The five task areas agree this contract exists to break a dependency cycle:
 * backlog task 19 (class form) consumes the paginated roster, task 25 (roster)
 * implements it and task 20 (assign teacher) needs the class detail it feeds —
 * so the WIRE SHAPE is settled here before any of the three start.
 *
 * It is the q/page/pageSize -> data + meta.pagination shape the task-04
 * directory kit consumes, with the exact bounds the server enforces in
 * schooltest-api/src/api/ops/lib/ops-pagination.ts: page defaults to 1,
 * pageSize to 25, pageSize caps at 200, q caps at 120 characters, and an
 * out-of-range value is a 400 — NEVER a silent clamp.
 *
 * The row IS the Students-tab row (./students-list), so the roster table and
 * the students table cannot drift; only the class filter is absent here,
 * because the path already pins one class of the school.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
export declare const OPS_ROSTER_PAGE_MAX = 100000;
export declare const OPS_ROSTER_PAGE_SIZE_DEFAULT = 25;
export declare const OPS_ROSTER_PAGE_SIZE_MAX = 200;
export declare const OPS_ROSTER_QUERY_MAX = 120;
export declare const rosterListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        archived: "archived";
        enrolled: "enrolled";
    }>>;
}, z.core.$strict>;
export type RosterListQuery = z.infer<typeof rosterListQuerySchema>;
export declare const rosterListResponseSchema: z.ZodObject<{
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
export type RosterListResponse = z.infer<typeof rosterListResponseSchema>;
export declare function rosterListQueryString(query: RosterListQuery): string;
export declare function rosterListPath(schoolDocumentId: string, classDocumentId: string, query?: RosterListQuery): string;
/** C-OPS-PORTAL-037 — GET /api/ops/schools/{documentId}/classes/{classDocumentId}/students */
export declare const RosterListOperation: OpsOperation<typeof rosterListQuerySchema, typeof rosterListResponseSchema>;
/**
 * C-OPS-PORTAL-038 — POST /api/ops/schools/{documentId}/classes/{classDocumentId}/roster/students
 * already has its server-side implementation (class/lib/class-ops-roster.actions.ts).
 * Its typed request is re-declared here so the paginated read and the write of the
 * same surface share one import; the body is exactly the one OpenAPI field — the
 * students already exist, so placement is the class-student-assignment logic's
 * job and the wire carries only their documentIds.
 */
export declare const rosterAddBodySchema: z.ZodObject<{
    student_documentIds: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export type RosterAddBody = z.infer<typeof rosterAddBodySchema>;
