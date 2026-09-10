/**
 * D-WIN — assessment windows beside the legacy school form window (backlog
 * task 01).
 *
 * The decisions pin the facts the flows in tasks 28 (result windows) and 20
 * (assign teacher / test window) must implement; this module pins the WIRE:
 *  - A window belongs to one school, carries a title, an IANA timezone, an
 *    opens/closes interval, one-to-four forms each bound to a skill, the
 *    selected classes and an IMMUTABLE cohort snapshot (persisted at
 *    creation; later roster moves never rewrite a window's cohort).
 *  - New sittings link a window nullable; old sittings and the current
 *    school form-window row keep their existing path — the window never
 *    replaces the legacy single school form window.
 *  - Status is complete | in_progress | scheduled | cancelled, derived from
 *    official sessions with invalidated attempts excluded; `average_cefr` is
 *    null unless a validated band mapping supports aggregation — CEFR labels
 *    are never averaged numerically.
 *  - Reopen is allowed only within seven calendar days of the close (the
 *    constant below is the decision, the flow task enforces it).
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** Seven calendar days, D-WIN — a reopen is possible only inside this window. */
export declare const ASSESSMENT_WINDOW_REOPEN_DAYS = 7;
/** Row status as the results table renders it (task 28 derives, never stores). */
export declare const windowStatusSchema: z.ZodEnum<{
    in_progress: "in_progress";
    complete: "complete";
    cancelled: "cancelled";
    scheduled: "scheduled";
}>;
export type WindowStatus = z.infer<typeof windowStatusSchema>;
export declare const OPS_WINDOW_TITLE_MAX = 255;
export declare const OPS_WINDOW_TIMEZONE_MAX = 100;
export declare const OPS_WINDOW_CLASSES_MAX = 200;
export declare const OPS_WINDOW_FORMS_MAX = 4;
/** One skill -> active form binding. Duplicate skills reject at the boundary. */
export declare const opsWindowFormBindingSchema: z.ZodObject<{
    skill: z.ZodEnum<{
        reading: "reading";
        listening: "listening";
        speaking: "speaking";
        writing: "writing";
    }>;
    form_documentId: z.ZodString;
}, z.core.$strict>;
export type OpsWindowFormBinding = z.infer<typeof opsWindowFormBindingSchema>;
/** POST /api/ops/schools/{documentId}/result-windows — strict create body. */
export declare const assessmentWindowCreateBodySchema: z.ZodObject<{
    title: z.ZodString;
    class_documentIds: z.ZodArray<z.ZodString>;
    forms: z.ZodArray<z.ZodObject<{
        skill: z.ZodEnum<{
            reading: "reading";
            listening: "listening";
            speaking: "speaking";
            writing: "writing";
        }>;
        form_documentId: z.ZodString;
    }, z.core.$strict>>;
    opens_at: z.ZodISODateTime;
    closes_at: z.ZodISODateTime;
    timezone: z.ZodString;
}, z.core.$strict>;
export type AssessmentWindowCreateBody = z.infer<typeof assessmentWindowCreateBodySchema>;
/**
 * Cross-field rule, checked here so the server error is deterministic:
 * `opens_at < closes_at`. The Zod refine gives every caller the same 400.
 */
export declare function validateWindowInterval(body: AssessmentWindowCreateBody): boolean;
/** GET row — historical and scheduled windows (ResultWindow). */
export declare const opsResultWindowRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        in_progress: "in_progress";
        complete: "complete";
        cancelled: "cancelled";
        scheduled: "scheduled";
    }>;
    opens_at: z.ZodISODateTime;
    closes_at: z.ZodISODateTime;
    eligible: z.ZodNumber;
    sat: z.ZodNumber;
    average_cefr: z.ZodNullable<z.ZodString>;
    average_percentage: z.ZodNullable<z.ZodNumber>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type OpsResultWindowRow = z.infer<typeof opsResultWindowRowSchema>;
export declare const opsResultWindowsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        in_progress: "in_progress";
        complete: "complete";
        cancelled: "cancelled";
        scheduled: "scheduled";
    }>>;
}, z.core.$strict>;
export type OpsResultWindowsQuery = z.infer<typeof opsResultWindowsQuerySchema>;
export declare const opsResultWindowsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            in_progress: "in_progress";
            complete: "complete";
            cancelled: "cancelled";
            scheduled: "scheduled";
        }>;
        opens_at: z.ZodISODateTime;
        closes_at: z.ZodISODateTime;
        eligible: z.ZodNumber;
        sat: z.ZodNumber;
        average_cefr: z.ZodNullable<z.ZodString>;
        average_percentage: z.ZodNullable<z.ZodNumber>;
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
export type OpsResultWindowsResponse = z.infer<typeof opsResultWindowsResponseSchema>;
/** PUT /api/ops/classes/{documentId}/test-window — assign or clear (null). */
export declare const classWindowAssignBodySchema: z.ZodObject<{
    window_documentId: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ClassWindowAssignBody = z.infer<typeof classWindowAssignBodySchema>;
export declare const classWindowAssignResultSchema: z.ZodObject<{
    class_documentId: z.ZodString;
    window_documentId: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ClassWindowAssignResult = z.infer<typeof classWindowAssignResultSchema>;
export declare const classWindowAssignResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        class_documentId: z.ZodString;
        window_documentId: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
/** Share outcome — explicit partial-delivery counts, never a full-success claim. */
export declare const opsWindowShareResultSchema: z.ZodObject<{
    window_documentId: z.ZodString;
    sent: z.ZodNumber;
    failed: z.ZodNumber;
}, z.core.$strict>;
export type OpsWindowShareResult = z.infer<typeof opsWindowShareResultSchema>;
export declare const opsWindowShareResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        window_documentId: z.ZodString;
        sent: z.ZodNumber;
        failed: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OpsWindowShareResponse = z.infer<typeof opsWindowShareResponseSchema>;
export declare const opsWindowActionResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            in_progress: "in_progress";
            complete: "complete";
            cancelled: "cancelled";
            scheduled: "scheduled";
        }>;
        opens_at: z.ZodISODateTime;
        closes_at: z.ZodISODateTime;
        eligible: z.ZodNumber;
        sat: z.ZodNumber;
        average_cefr: z.ZodNullable<z.ZodString>;
        average_percentage: z.ZodNullable<z.ZodNumber>;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OpsWindowActionResponse = z.infer<typeof opsWindowActionResponseSchema>;
/** C-OPS-PORTAL-054 — GET /api/ops/schools/{documentId}/result-windows */
export declare const ResultWindowsOperation: OpsOperation<typeof opsResultWindowsQuerySchema, typeof opsResultWindowsResponseSchema>;
declare const assessmentWindowCreateResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<{
            in_progress: "in_progress";
            complete: "complete";
            cancelled: "cancelled";
            scheduled: "scheduled";
        }>;
        opens_at: z.ZodISODateTime;
        closes_at: z.ZodISODateTime;
        eligible: z.ZodNumber;
        sat: z.ZodNumber;
        average_cefr: z.ZodNullable<z.ZodString>;
        average_percentage: z.ZodNullable<z.ZodNumber>;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>;
}, z.core.$strict>;
export type AssessmentWindowCreateResponse = z.infer<typeof assessmentWindowCreateResponseSchema>;
export { assessmentWindowCreateResponseSchema };
/** C-OPS-PORTAL-073 — POST /api/ops/schools/{documentId}/result-windows */
export declare const AssessmentWindowCreateOperation: OpsOperation<typeof assessmentWindowCreateBodySchema, typeof assessmentWindowCreateResponseSchema>;
/**
 * C-OPS-PORTAL-074 — PUT /api/ops/schools/{documentId}/classes/{classDocumentId}/window
 *
 * Task 22 / D-26 (X-02): the path is CORRECTED here to the route that has
 * always been deployed (`schooltest-api/src/api/class/routes/02-custom-ops-
 * class.ts`, handler `api::class.class.opsAssignClassWindow`). The record
 * previously declared `/api/ops/classes/{documentId}/test-window`, a path
 * nothing has ever served — verified live: the old path answers 405, the
 * corrected one answers 200 (proof/22.md). The route itself is never
 * renamed: `api::class.class.opsAssignClassWindow` is the permission grant
 * and renaming it would drop the grant at boot.
 */
export declare const ClassWindowAssignOperation: OpsOperation<typeof classWindowAssignBodySchema, typeof classWindowAssignResponseSchema>;
