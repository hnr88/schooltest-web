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

import { documentIdSchema, type OpsOperation } from './core';

const FORM_CODE_MAX = 100;
const ITEM_CODE_MAX = 100;
const TASK_TYPE_MAX = 50;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const YEAR_BAND_MAX = 50;
const STATUS_MAX = 50;
const STAGE_MAX = 10;

/** These two reads take no body and no query; the trio's only query is 04b's. */
export const emptyInspectionQuerySchema = z.strictObject({});

/* --- C-OPS-04a: form Q-matrix + key inspection --------------------------- */

/**
 * One authored item as the inspection surface reports it. `key` is the schema's
 * `correct_key` renamed by the service — the ONLY surface in the product that
 * serves a correct key, which is why the route is ops-only.
 */
export const formInspectionItemSchema = z.strictObject({
  item_code: z.string().max(ITEM_CODE_MAX),
  task_type: z.string().max(TASK_TYPE_MAX).nullable(),
  stage: z.number().int().min(0).max(STAGE_MAX).nullable(),
  attribute_vector: z.unknown(),
  key: z.unknown(),
});
export type FormInspectionItem = z.infer<typeof formInspectionItemSchema>;

/**
 * `locked` is the C-WIN-02 flag: any submitted/terminated session against this
 * form. It is the reason this read is a surface and not a form-picker field —
 * a locked form cannot be swapped out of a live window.
 */
export const formInspectionSchema = z.strictObject({
  form_code: z.string().max(FORM_CODE_MAX),
  items: z.array(formInspectionItemSchema),
  anchors: z.array(z.string().max(ITEM_CODE_MAX)),
  locked: z.boolean(),
});
export type FormInspection = z.infer<typeof formInspectionSchema>;

export const formInspectionResponseSchema = z.strictObject({ data: formInspectionSchema });
export type FormInspectionResponse = z.infer<typeof formInspectionResponseSchema>;

/** The route path for one form's inspection. */
export function formInspectionPath(documentId: string): string {
  return `/api/ops/forms/${documentId}/inspection`;
}

export const FormInspectionOperation: OpsOperation<
  typeof emptyInspectionQuerySchema,
  typeof formInspectionResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-04a',
  method: 'GET',
  path: '/api/ops/forms/:documentId/inspection',
  request: emptyInspectionQuerySchema,
  response: formInspectionResponseSchema,
  success: 200,
  errors: [401, 403, 404, 429, 500],
});

/* --- C-OPS-04b: the raw item-level responses.csv ------------------------- */

/**
 * `session_documentId` is REQUIRED — the service 400s
 * ("session_documentId query parameter is required") rather than exporting the
 * whole response table. An unknown session is NOT an error: it yields the
 * header-only CSV, which is the honest answer to "this session stored nothing".
 */
export const responsesCsvQuerySchema = z.strictObject({
  session_documentId: documentIdSchema,
});
export type ResponsesCsvQuery = z.infer<typeof responsesCsvQuerySchema>;

export const OPS_RESPONSES_CSV_PATH = '/api/ops/responses.csv';

/** The live header row, in the service's own column order. */
export const OPS_RESPONSES_CSV_HEADER =
  'session_document_id,sequence_index,item_code,raw_response,presented_at,responded_at';

/**
 * Fallback ONLY. The real name is the server's
 * `Content-Disposition: attachment; filename="responses-<sessionId>.csv"`.
 */
export const OPS_RESPONSES_CSV_FALLBACK_FILENAME = 'responses.csv';

/* --- C-OPS-04c: view-as-teacher (audited impersonation read) ------------- */

export const viewAsTeacherIdentitySchema = z.strictObject({
  documentId: documentIdSchema,
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  email: z.string().max(EMAIL_MAX).nullable(),
});
export type ViewAsTeacherIdentity = z.infer<typeof viewAsTeacherIdentitySchema>;

/** The C-CLS-01 whitelist projection — identical to the teacher-facing one. */
export const viewAsClassSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(NAME_MAX).nullable(),
  year_band: z.string().max(YEAR_BAND_MAX).nullable(),
  teachers: z.array(
    z.strictObject({
      documentId: documentIdSchema,
      first_name: z.string().max(NAME_MAX).nullable(),
      last_name: z.string().max(NAME_MAX).nullable(),
    }),
  ),
  student_count: z.number().int().nonnegative(),
});
export type ViewAsClass = z.infer<typeof viewAsClassSchema>;

export const viewAsSittingSchema = z.strictObject({
  documentId: documentIdSchema,
  code: z.string().max(NAME_MAX).nullable(),
  status: z.string().max(STATUS_MAX),
  mode: z.string().max(STATUS_MAX).nullable(),
  skill: z.string().max(STATUS_MAX).nullable(),
  opened_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  class: z
    .strictObject({ documentId: documentIdSchema, name: z.string().max(NAME_MAX).nullable() })
    .nullable(),
  form: z
    .strictObject({
      documentId: documentIdSchema,
      form_code: z.string().max(FORM_CODE_MAX).nullable(),
    })
    .nullable(),
});
export type ViewAsSitting = z.infer<typeof viewAsSittingSchema>;

/**
 * EVERY successful call to this surface writes an `api::audit-log` row
 * (`action: 'view_as_teacher'`, actor + target + timestamp) — proven live, the
 * count moved 1 -> 2 in `audit_logs` for one call. That is why the web consumer
 * must fetch it ONLY on an explicit operator action and never on render.
 */
export const viewAsTeacherSchema = z.strictObject({
  teacher: viewAsTeacherIdentitySchema,
  classes: z.array(viewAsClassSchema),
  sittings: z.array(viewAsSittingSchema),
  monitors: z.array(z.unknown()),
});
export type ViewAsTeacher = z.infer<typeof viewAsTeacherSchema>;

export const viewAsTeacherResponseSchema = z.strictObject({ data: viewAsTeacherSchema });
export type ViewAsTeacherResponse = z.infer<typeof viewAsTeacherResponseSchema>;

/** The route path for one teacher's audited view-as read. */
export function viewAsTeacherPath(documentId: string): string {
  return `/api/ops/view-as-teacher/${documentId}`;
}

export const ViewAsTeacherOperation: OpsOperation<
  typeof emptyInspectionQuerySchema,
  typeof viewAsTeacherResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-04c',
  method: 'GET',
  path: '/api/ops/view-as-teacher/:documentId',
  request: emptyInspectionQuerySchema,
  response: viewAsTeacherResponseSchema,
  success: 200,
  errors: [401, 403, 404, 429, 500],
});
