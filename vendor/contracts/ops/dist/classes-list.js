"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassRestoreOperation = exports.ClassArchiveOperation = exports.classArchiveBodySchema = exports.ClassCreateOperation = exports.classCreateResponseSchema = exports.classCreateRowSchema = exports.classCreateBodySchema = exports.classRowEnvelopeSchema = exports.ClassesListOperation = exports.classesListRequestSchema = exports.classesListResponseSchema = exports.classesListQuerySchema = exports.classesListPaginationSchema = exports.classRowSchema = exports.classTestWindowSchema = exports.classSchoolRefSchema = exports.classTeacherRefSchema = exports.classListSortSchema = exports.classListStatusSchema = exports.timestampSchema = void 0;
exports.classRowStatus = classRowStatus;
exports.classesListQueryParams = classesListQueryParams;
exports.classesListPath = classesListPath;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const NAME_MAX = 255;
const PERSON_NAME_MAX = 100;
const YEAR_BAND_MAX = 50;
const QUERY_MAX = 120;
const MAX_PAGE = 100000;
const MAX_PAGE_SIZE = 200;
const MAX_TEACHERS_PER_CLASS = 100;
const INT32_MAX = 2147483647;
/** Strapi serialises every datetime as an ISO-8601 instant. */
exports.timestampSchema = zod_1.z.iso.datetime({ offset: true });
/** The three states the Classes tab's filter chips select between. */
exports.classListStatusSchema = zod_1.z.enum(['active', 'pending_setup', 'archived']);
/** The two orderings the tab offers; anything else is a 400 server-side. */
exports.classListSortSchema = zod_1.z.enum(['name:asc', 'student_count:desc']);
exports.classTeacherRefSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    first_name: zod_1.z.string().max(PERSON_NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(PERSON_NAME_MAX).nullable(),
});
exports.classSchoolRefSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(NAME_MAX).nullable(),
});
/**
 * The school's live form window, echoed on every class of that school. The
 * product stores ONE window per school (api::form-window, replace semantics),
 * so this is the real window a class's students sit — not a per-class field
 * invented to fill the design's `{year} · {window}` subtitle.
 */
exports.classTestWindowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    title: zod_1.z.string().min(1).max(NAME_MAX),
    opens_at: exports.timestampSchema,
    closes_at: exports.timestampSchema,
});
exports.classRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(NAME_MAX).nullable(),
    year_band: zod_1.z.string().max(YEAR_BAND_MAX).nullable(),
    teachers: zod_1.z.array(exports.classTeacherRefSchema).max(MAX_TEACHERS_PER_CLASS),
    student_count: zod_1.z.number().int().min(0).max(INT32_MAX),
    archived_at: exports.timestampSchema.nullable(),
    school: exports.classSchoolRefSchema,
    primary_teacher: exports.classTeacherRefSchema.nullable(),
    updatedAt: exports.timestampSchema,
    test_window: exports.classTestWindowSchema.nullable(),
});
exports.classesListPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(MAX_PAGE),
    pageSize: zod_1.z.number().int().min(1).max(MAX_PAGE_SIZE),
    pageCount: zod_1.z.number().int().min(0).max(INT32_MAX),
    total: zod_1.z.number().int().min(0).max(INT32_MAX),
});
/**
 * The accepted query string. Strict: an unknown key is a caller mistake, and
 * silently ignoring it would hand back an unfiltered page that looks filtered.
 */
exports.classesListQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(MAX_PAGE).optional(),
    pageSize: zod_1.z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
    q: zod_1.z.string().max(QUERY_MAX).optional(),
    status: exports.classListStatusSchema.optional(),
    teacher: core_1.documentIdSchema.optional(),
    year_band: zod_1.z.string().max(YEAR_BAND_MAX).optional(),
    sort: exports.classListSortSchema.optional(),
});
/** 200 body — `{ data, meta }`, unlike the single-object `{ data }` envelope. */
exports.classesListResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.classRowSchema).max(MAX_PAGE_SIZE),
    meta: zod_1.z.strictObject({ pagination: exports.classesListPaginationSchema }),
});
/** The empty request body: this operation is a GET and accepts none. */
exports.classesListRequestSchema = zod_1.z.strictObject({});
/**
 * THE status rule, in one place. `archived_at` wins outright; a class with no
 * primary teacher is still being set up; everything else is active.
 */
function classRowStatus(row) {
    if (row.archived_at !== null)
        return 'archived';
    if (row.primary_teacher === null)
        return 'pending_setup';
    return 'active';
}
/**
 * Build the query string for one request. Kept here rather than in the web
 * client so the keys the server parses and the keys the client sends are the
 * same literals. Undefined/empty values are dropped, never sent as "".
 */
function classesListQueryParams(query) {
    const parsed = exports.classesListQuerySchema.parse(query);
    const params = {};
    for (const [key, value] of Object.entries(parsed)) {
        if (value === undefined || value === '')
            continue;
        params[key] = String(value);
    }
    return params;
}
/** Path of the operation for one school. */
function classesListPath(schoolDocumentId) {
    return `/api/ops/schools/${core_1.documentIdSchema.parse(schoolDocumentId)}/classes`;
}
/**
 * C-OPS-PORTAL-028. `response` is the full `{ data, meta }` body; the plain
 * `dataEnvelope` is re-used only for the row-level assertions a caller may
 * want, so the shared helper stays the one envelope definition.
 */
exports.ClassesListOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-028',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/classes',
    request: exports.classesListRequestSchema,
    response: exports.classesListResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/** `{ data: ClassRow }` — used when a single row is read back for assertions. */
exports.classRowEnvelopeSchema = (0, core_1.dataEnvelope)(exports.classRowSchema);
/* ------------------------------------------------------------------ *
 * Class create — C-OPS-CLASS-CREATE. Task 23.
 *
 * Row 17 flagged this schema as missing and left class creation out of
 * `OpsClassesTab.tsx` for exactly that reason (OP-2: no control wired to a
 * stub). Verified live against `127.0.0.1:5500` before writing this
 * (`proof/23.md`) rather than trusting `contracts/classes.md`'s existing
 * record, which is WRONG on two counts:
 *
 *  - The record's `request` shape adds `teacher_documentId?` and
 *    `test_window_documentId?`. The deployed route
 *    (`api::class.class.opsCreateClass`) accepts ONLY `name` and
 *    `year_band` — a relation key (`teacher_documentIds` OR the record's
 *    singular `teacher_documentId`) is a named 400
 *    ("this ops write accepts name and year_band only; teacher assignment
 *    is the assign-teacher route (task 20)" / "unknown field"). Assigning a
 *    teacher or a window on create is therefore a SEPARATE follow-up call —
 *    `ClassCreateOperation` below is name/year_band only, by design.
 *  - The record's `response` is `dataEnvelope(classRowSchema)` (the full
 *    row). The deployed handler returns a PARTIAL row —
 *    `{ documentId, name, year_band, teachers, student_count }` — missing
 *    `archived_at`, `school`, `primary_teacher`, `updatedAt` and
 *    `test_window`. `classRowSchema` is `strictObject`, so parsing the real
 *    response against it would THROW. `classCreateResponseSchema` below is
 *    the shape the server actually returns.
 *  - The record lists 409 among the create errors. No 409 path exists for
 *    this route — a duplicate name (case-insensitive, verified) answers
 *    **400** `ValidationError` with `details.fields: ['name']`, never 409.
 *    `errors` below is the verified list only.
 */
exports.classCreateBodySchema = zod_1.z.strictObject({
    name: zod_1.z.string().trim().min(1).max(NAME_MAX),
    year_band: zod_1.z.string().max(YEAR_BAND_MAX).nullable().optional(),
});
/** The PARTIAL row `opsCreateClass` actually projects — see the block comment above. */
exports.classCreateRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(NAME_MAX).nullable(),
    year_band: zod_1.z.string().max(YEAR_BAND_MAX).nullable(),
    teachers: zod_1.z.array(exports.classTeacherRefSchema).max(MAX_TEACHERS_PER_CLASS),
    student_count: zod_1.z.number().int().min(0).max(INT32_MAX),
});
exports.classCreateResponseSchema = (0, core_1.dataEnvelope)(exports.classCreateRowSchema);
exports.ClassCreateOperation = Object.freeze({
    contractId: 'C-OPS-CLASS-CREATE',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/classes',
    request: exports.classCreateBodySchema,
    response: exports.classCreateResponseSchema,
    success: 201,
    errors: [400, 401, 403, 404],
});
/* ------------------------------------------------------------------ *
 * Class lifecycle — C-OPS-CLASS-ARCHIVE / C-OPS-CLASS-RESTORE.
 *
 * DECLARATIONS ONLY. No route, controller, grant or client hook exists for
 * either path yet; task 06 implements both against these symbols so the server
 * it writes and the table that calls it start from one definition. The status
 * rule needs nothing new: `classRowStatus` above already reads `archived_at`,
 * so archiving changes a value, never the wire shape.
 * ------------------------------------------------------------------ */
/**
 * Both writes take an EMPTY body. Which operation it is comes from the path,
 * never from a payload key, and the strict object means a caller cannot smuggle
 * `archived_at` — or a school/class reference — past the route scope. Restore
 * reuses this schema rather than restating it: one empty-body definition for
 * the pair, so the two cannot drift apart.
 */
exports.classArchiveBodySchema = zod_1.z.strictObject({});
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
exports.ClassArchiveOperation = Object.freeze({
    contractId: 'C-OPS-CLASS-ARCHIVE',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/classes/{classDocumentId}/archive',
    request: exports.classArchiveBodySchema,
    response: exports.classRowEnvelopeSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409],
});
/**
 * C-OPS-CLASS-RESTORE. 200 with `archived_at` cleared to null. A restored class
 * returns to `active` or `pending_setup` purely by derivation — there is no
 * stored status to reconcile, which is why restore needs no body either.
 */
exports.ClassRestoreOperation = Object.freeze({
    contractId: 'C-OPS-CLASS-RESTORE',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/classes/{classDocumentId}/restore',
    request: exports.classArchiveBodySchema,
    response: exports.classRowEnvelopeSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409],
});
