/**
 * Ledger row 11 / D-007 (msn-0da39441) — the C-OPS-04 ops INSPECTION surfaces
 * of mvp-updates s.4.2, already live in
 * `schooltest-api/src/api/ops/routes/04-custom-surfaces.ts`:
 *
 *   GET /api/ops/forms/:documentId/inspection   -> form composition + keys + lock
 *   GET /api/ops/responses.csv?session_documentId=  -> text/csv (NOT JSON)
 *   GET /api/ops/view-as-teacher/:documentId    -> the teacher-scoped payload set
 *
 * All three carry `global::is-ops`, so anon and every non-ops role 403 before
 * the controller runs (measured: anon 403 / teacher 403 / ops 200 on each).
 *
 * The shapes below MIRROR THE LIVE WIRE, captured before this file was written
 * (`.codephant/missions/msn-0da39441-.../artifacts/task-11-*.json`) rather than
 * taken from the api's TypeScript: the api service hand-projects every field
 * (`src/api/ops/services/surfaces.ts`), so the enumeration here is exhaustive
 * and STRICT per this package's header rule — a field the server starts sending
 * must break this build instead of arriving unnoticed in the browser.
 *
 * THREE DELIBERATE `unknown`s, not laziness:
 *  - `attribute_vector` and `key` are `unknown` in the api's own
 *    `InspectionItem` type (a Q-matrix row is a number vector today, a key is
 *    `{type, answer}`, and both are authored per task type) — the inspection
 *    surface exists to SHOW them verbatim, so it must not narrow them;
 *  - `monitors` is the C-SIT-02 monitor payload verbatim (`api::sitting.monitor`
 *    output). Re-declaring that shape here would make this file a second source
 *    of truth for a contract that already has one, so the array stays opaque and
 *    the consumer renders only what it can honestly claim: how many there are.
 *
 * responses.csv has no response schema by nature — it is `text/csv` with the
 * filename in `Content-Disposition`. What IS contract here is the query
 * (`session_documentId` required; a missing one is a 400) and the path.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** These two reads take no body and no query; the trio's only query is 04b's. */
export declare const emptyInspectionQuerySchema: z.ZodObject<{}, z.core.$strict>;
/**
 * One authored item as the inspection surface reports it. `key` is the schema's
 * `correct_key` renamed by the service — the ONLY surface in the product that
 * serves a correct key, which is why the route is ops-only.
 */
export declare const formInspectionItemSchema: z.ZodObject<{
    item_code: z.ZodString;
    task_type: z.ZodNullable<z.ZodString>;
    stage: z.ZodNullable<z.ZodNumber>;
    attribute_vector: z.ZodUnknown;
    key: z.ZodUnknown;
}, z.core.$strict>;
export type FormInspectionItem = z.infer<typeof formInspectionItemSchema>;
/**
 * `locked` is the C-WIN-02 flag: any submitted/terminated session against this
 * form. It is the reason this read is a surface and not a form-picker field —
 * a locked form cannot be swapped out of a live window.
 */
export declare const formInspectionSchema: z.ZodObject<{
    form_code: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        item_code: z.ZodString;
        task_type: z.ZodNullable<z.ZodString>;
        stage: z.ZodNullable<z.ZodNumber>;
        attribute_vector: z.ZodUnknown;
        key: z.ZodUnknown;
    }, z.core.$strict>>;
    anchors: z.ZodArray<z.ZodString>;
    locked: z.ZodBoolean;
}, z.core.$strict>;
export type FormInspection = z.infer<typeof formInspectionSchema>;
export declare const formInspectionResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        form_code: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            item_code: z.ZodString;
            task_type: z.ZodNullable<z.ZodString>;
            stage: z.ZodNullable<z.ZodNumber>;
            attribute_vector: z.ZodUnknown;
            key: z.ZodUnknown;
        }, z.core.$strict>>;
        anchors: z.ZodArray<z.ZodString>;
        locked: z.ZodBoolean;
    }, z.core.$strict>;
}, z.core.$strict>;
export type FormInspectionResponse = z.infer<typeof formInspectionResponseSchema>;
/** The route path for one form's inspection. */
export declare function formInspectionPath(documentId: string): string;
export declare const FormInspectionOperation: OpsOperation<typeof emptyInspectionQuerySchema, typeof formInspectionResponseSchema>;
/**
 * `session_documentId` is REQUIRED — the service 400s
 * ("session_documentId query parameter is required") rather than exporting the
 * whole response table. An unknown session is NOT an error: it yields the
 * header-only CSV, which is the honest answer to "this session stored nothing".
 */
export declare const responsesCsvQuerySchema: z.ZodObject<{
    session_documentId: z.ZodString;
}, z.core.$strict>;
export type ResponsesCsvQuery = z.infer<typeof responsesCsvQuerySchema>;
export declare const OPS_RESPONSES_CSV_PATH = "/api/ops/responses.csv";
/** The live header row, in the service's own column order. */
export declare const OPS_RESPONSES_CSV_HEADER = "session_document_id,sequence_index,item_code,raw_response,presented_at,responded_at";
/**
 * Fallback ONLY. The real name is the server's
 * `Content-Disposition: attachment; filename="responses-<sessionId>.csv"`.
 */
export declare const OPS_RESPONSES_CSV_FALLBACK_FILENAME = "responses.csv";
export declare const viewAsTeacherIdentitySchema: z.ZodObject<{
    documentId: z.ZodString;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type ViewAsTeacherIdentity = z.infer<typeof viewAsTeacherIdentitySchema>;
/** The C-CLS-01 whitelist projection — identical to the teacher-facing one. */
export declare const viewAsClassSchema: z.ZodObject<{
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
export type ViewAsClass = z.infer<typeof viewAsClassSchema>;
export declare const viewAsSittingSchema: z.ZodObject<{
    documentId: z.ZodString;
    code: z.ZodNullable<z.ZodString>;
    status: z.ZodString;
    mode: z.ZodNullable<z.ZodString>;
    skill: z.ZodNullable<z.ZodString>;
    opened_at: z.ZodNullable<z.ZodString>;
    closed_at: z.ZodNullable<z.ZodString>;
    class: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    form: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        form_code: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ViewAsSitting = z.infer<typeof viewAsSittingSchema>;
/**
 * EVERY successful call to this surface writes an `api::audit-log` row
 * (`action: 'view_as_teacher'`, actor + target + timestamp) — proven live, the
 * count moved 1 -> 2 in `audit_logs` for one call. That is why the web consumer
 * must fetch it ONLY on an explicit operator action and never on render.
 */
export declare const viewAsTeacherSchema: z.ZodObject<{
    teacher: z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
    classes: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        year_band: z.ZodNullable<z.ZodString>;
        teachers: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        student_count: z.ZodNumber;
    }, z.core.$strict>>;
    sittings: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        code: z.ZodNullable<z.ZodString>;
        status: z.ZodString;
        mode: z.ZodNullable<z.ZodString>;
        skill: z.ZodNullable<z.ZodString>;
        opened_at: z.ZodNullable<z.ZodString>;
        closed_at: z.ZodNullable<z.ZodString>;
        class: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        form: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            form_code: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    monitors: z.ZodArray<z.ZodUnknown>;
}, z.core.$strict>;
export type ViewAsTeacher = z.infer<typeof viewAsTeacherSchema>;
export declare const viewAsTeacherResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        teacher: z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
            email: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>;
        classes: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            year_band: z.ZodNullable<z.ZodString>;
            teachers: z.ZodArray<z.ZodObject<{
                documentId: z.ZodString;
                first_name: z.ZodNullable<z.ZodString>;
                last_name: z.ZodNullable<z.ZodString>;
            }, z.core.$strict>>;
            student_count: z.ZodNumber;
        }, z.core.$strict>>;
        sittings: z.ZodArray<z.ZodObject<{
            documentId: z.ZodString;
            code: z.ZodNullable<z.ZodString>;
            status: z.ZodString;
            mode: z.ZodNullable<z.ZodString>;
            skill: z.ZodNullable<z.ZodString>;
            opened_at: z.ZodNullable<z.ZodString>;
            closed_at: z.ZodNullable<z.ZodString>;
            class: z.ZodNullable<z.ZodObject<{
                documentId: z.ZodString;
                name: z.ZodNullable<z.ZodString>;
            }, z.core.$strict>>;
            form: z.ZodNullable<z.ZodObject<{
                documentId: z.ZodString;
                form_code: z.ZodNullable<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        monitors: z.ZodArray<z.ZodUnknown>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ViewAsTeacherResponse = z.infer<typeof viewAsTeacherResponseSchema>;
/** The route path for one teacher's audited view-as read. */
export declare function viewAsTeacherPath(documentId: string): string;
export declare const ViewAsTeacherOperation: OpsOperation<typeof emptyInspectionQuerySchema, typeof viewAsTeacherResponseSchema>;
