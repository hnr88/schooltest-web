"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsListOperation = exports.opsStudentsListResponseSchema = exports.opsStudentsListQuerySchema = exports.opsStudentsPaginationSchema = exports.opsStudentRowSchema = exports.opsStudentLatestResultSchema = exports.opsStudentClassRefSchema = exports.OPS_STUDENTS_QUERY_MAX = exports.OPS_STUDENTS_PAGE_SIZE_MAX = exports.OPS_STUDENTS_PAGE_SIZE_DEFAULT = exports.OPS_STUDENTS_PAGE_MAX = exports.OPS_STUDENT_YEAR_LEVEL_MAX = exports.OPS_STUDENT_YEAR_LEVEL_MIN = exports.opsAcaraPhaseSchema = exports.OPS_ACARA_PHASES = exports.opsStudentStatusSchema = exports.OPS_STUDENT_STATUSES = void 0;
exports.opsStudentsListQueryString = opsStudentsListQueryString;
exports.opsStudentsListPath = opsStudentsListPath;
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
const zod_1 = require("zod");
const core_1 = require("./core");
/* ------------------------------------------------------------------ *
 * Bounds — the exact numbers the server validates and the tests assert.
 * ------------------------------------------------------------------ */
/** api::student.student `status` enum, stored verbatim. `enrolled` is the
 *  roster row that has not finished setup; the UI labels it "Pending setup"
 *  but the wire value is never renamed. */
exports.OPS_STUDENT_STATUSES = ['active', 'archived', 'enrolled'];
exports.opsStudentStatusSchema = zod_1.z.enum(exports.OPS_STUDENT_STATUSES);
/** api::student.student `acara_phase` enum. */
exports.OPS_ACARA_PHASES = [
    'beginning',
    'emerging',
    'developing',
    'consolidating',
];
exports.opsAcaraPhaseSchema = zod_1.z.enum(exports.OPS_ACARA_PHASES);
exports.OPS_STUDENT_YEAR_LEVEL_MIN = 7;
exports.OPS_STUDENT_YEAR_LEVEL_MAX = 12;
exports.OPS_STUDENTS_PAGE_MAX = 100000;
exports.OPS_STUDENTS_PAGE_SIZE_DEFAULT = 25;
exports.OPS_STUDENTS_PAGE_SIZE_MAX = 200;
exports.OPS_STUDENTS_QUERY_MAX = 120;
const CLASS_NAME_MAX = 255;
const GIVEN_NAME_MAX = 100;
const FAMILY_NAME_MAX = 100;
const FIRST_LANGUAGE_MAX = 100;
const CEFR_LEVEL_MAX = 10;
const COUNT_MAX = 2147483647;
/* ------------------------------------------------------------------ *
 * Row projection
 * ------------------------------------------------------------------ */
exports.opsStudentClassRefSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(CLASS_NAME_MAX).nullable(),
});
/**
 * The student's latest OFFICIAL, complete, non-invalidated skill result.
 * `cefr_level` is the stored crosswalk band (null while a result carries none)
 * and `percentage` is the proportion-correct score of that sitting rescaled to
 * 0..100 — null when the sitting has no server-scored evidence yet, and 0 when
 * the student genuinely scored nothing.
 */
exports.opsStudentLatestResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    cefr_level: zod_1.z.string().max(CEFR_LEVEL_MAX).nullable(),
    percentage: zod_1.z.number().min(0).max(100).nullable(),
    completed_at: zod_1.z.iso.datetime(),
});
exports.opsStudentRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    given_name: zod_1.z.string().min(1).max(GIVEN_NAME_MAX),
    // A mononym is ordinary (M-CT-STUDENT-NAME): family_name is nullable and the
    // row must never synthesise one.
    family_name: zod_1.z.string().max(FAMILY_NAME_MAX).nullable(),
    year_level: zod_1.z
        .number()
        .int()
        .min(exports.OPS_STUDENT_YEAR_LEVEL_MIN)
        .max(exports.OPS_STUDENT_YEAR_LEVEL_MAX)
        .nullable(),
    first_language: zod_1.z.string().max(FIRST_LANGUAGE_MAX).nullable(),
    acara_phase: exports.opsAcaraPhaseSchema.nullable(),
    status: exports.opsStudentStatusSchema,
    class: exports.opsStudentClassRefSchema.nullable(),
    latest_result: exports.opsStudentLatestResultSchema.nullable(),
    updatedAt: zod_1.z.iso.datetime(),
});
exports.opsStudentsPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(exports.OPS_STUDENTS_PAGE_MAX),
    pageSize: zod_1.z.number().int().min(1).max(exports.OPS_STUDENTS_PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0).max(COUNT_MAX),
    total: zod_1.z.number().int().min(0).max(COUNT_MAX),
});
/* ------------------------------------------------------------------ *
 * Request
 * ------------------------------------------------------------------ */
/**
 * The decoded query. HTTP delivers strings; `page`, `pageSize` and `year_level`
 * decode ONCE to integers here, so a value outside the bounds is a 400 rather
 * than a silent clamp. `class` must be a class of the school in the path.
 */
exports.opsStudentsListQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(exports.OPS_STUDENTS_PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(1).max(exports.OPS_STUDENTS_PAGE_SIZE_MAX).optional(),
    q: zod_1.z.string().max(exports.OPS_STUDENTS_QUERY_MAX).optional(),
    status: exports.opsStudentStatusSchema.optional(),
    class: core_1.documentIdSchema.optional(),
    year_level: zod_1.z
        .number()
        .int()
        .min(exports.OPS_STUDENT_YEAR_LEVEL_MIN)
        .max(exports.OPS_STUDENT_YEAR_LEVEL_MAX)
        .optional(),
});
exports.opsStudentsListResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.opsStudentRowSchema).max(exports.OPS_STUDENTS_PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: exports.opsStudentsPaginationSchema }),
});
/**
 * The one encoder for this operation's query — client and tests share it, so an
 * omitted filter is an ABSENT key rather than an empty value, and no caller
 * invents a second spelling of `year_level`. Written with plain string pairs
 * (no URLSearchParams) because this package targets ES2020 with no DOM/node lib.
 */
function opsStudentsListQueryString(query) {
    const pairs = [];
    if (query.page !== undefined)
        pairs.push(['page', String(query.page)]);
    if (query.pageSize !== undefined)
        pairs.push(['pageSize', String(query.pageSize)]);
    if (query.q !== undefined && query.q !== '')
        pairs.push(['q', query.q]);
    if (query.status !== undefined)
        pairs.push(['status', query.status]);
    if (query.class !== undefined)
        pairs.push(['class', query.class]);
    if (query.year_level !== undefined)
        pairs.push(['year_level', String(query.year_level)]);
    return pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}
/** `/api/ops/schools/{documentId}/students` with the encoded query appended. */
function opsStudentsListPath(schoolDocumentId, query = {}) {
    const search = opsStudentsListQueryString(query);
    const base = `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students`;
    return search === '' ? base : `${base}?${search}`;
}
exports.StudentsListOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-035',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/students',
    request: exports.opsStudentsListQuerySchema,
    response: exports.opsStudentsListResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
