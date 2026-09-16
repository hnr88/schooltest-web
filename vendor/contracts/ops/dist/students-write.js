"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpsStudentUpdateOperation = exports.OpsStudentCreateOperation = exports.opsStudentUpdateResponseSchema = exports.opsStudentCreateResponseSchema = exports.opsStudentUpdateBodySchema = exports.opsStudentCreateBodySchema = exports.opsStudentDetailSchema = void 0;
exports.opsStudentCreatePath = opsStudentCreatePath;
exports.opsStudentUpdatePath = opsStudentUpdatePath;
/**
 * C-OPS-STU-CREATE / C-OPS-STU-PATCH — the ops portal's write half of the
 * student record: POST /api/ops/schools/{documentId}/students (create) and
 * PATCH /api/ops/schools/{documentId}/students/{studentDocumentId} (partial
 * edit). ONE definition of the shapes, imported by the Strapi handlers, by the
 * typed web queries and by the HTTP assertions on both sides. Pure Zod +
 * TypeScript: nothing here may import Strapi, Next or node built-ins.
 *
 * Rules the module pins:
 *  - The ops portal must be able to CREATE and FULLY EDIT any field of any
 *    student (name, email, DOB, language, year level, ACARA phase, class,
 *    EALD fields), so a body is ANY SUBSET of the writable scalars: omitted
 *    means unchanged on a patch, null clears a nullable field.
 *  - A create requires `given_name`; a patch carrying NO recognised key at
 *    all is a client bug and a 400, never a silent no-op.
 *  - `student_status` is NOT writable here: active/archived moves flow ONLY
 *    through the deactivate/reactivate operations (C-OPS-PORTAL-014/015),
 *    where the seat and in-flight-session cascade live.
 *  - `class_documentId` is the class relation: on a create an optional
 *    string, on a patch a string or an explicit null (null unassigns). It
 *    must name a class of the school in the path.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const students_list_1 = require("./students-list");
/* ------------------------------------------------------------------ *
 * Detail projection — the create/patch response row
 * ------------------------------------------------------------------ */
/**
 * The row both write operations return: the same detail family the school
 * admin's create/update answers (C-CHD-02/03), scoped to exactly the keys the
 * ops portal renders. `acara_phase`/`first_language` stay plain strings (the
 * stored values), while `student_status` is the stored
 * active|archived|enrolled enum shared with the roster row.
 */
exports.opsStudentDetailSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    given_name: zod_1.z.string(),
    family_name: zod_1.z.string().nullable(),
    email: zod_1.z.string().nullable(),
    date_of_birth: zod_1.z.string().nullable(),
    year_level: zod_1.z.number().int().nullable(),
    first_language: zod_1.z.string().nullable(),
    acara_phase: zod_1.z.string().nullable(),
    student_status: students_list_1.opsStudentStatusSchema,
    class: zod_1.z
        .strictObject({ documentId: core_1.documentIdSchema, name: zod_1.z.string().nullable() })
        .nullable(),
    school: zod_1.z.strictObject({ documentId: core_1.documentIdSchema }).nullable(),
});
/* ------------------------------------------------------------------ *
 * Request bodies
 * ------------------------------------------------------------------ */
const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/**
 * C-OPS-STU-CREATE body. `given_name` is the only required key — everything
 * else may be omitted (a student does not start with a class, email or EALD
 * data). `first_language` stays a plain string: the server's FIRST_LANGUAGES
 * enum is not exported from this package, and a hand-copied enum here could
 * drift from the one the server enforces. `email` likewise carries no pattern
 * — the package has no shared email pattern to reuse, and the server's own
 * email validation stays the single runtime enforcer.
 */
exports.opsStudentCreateBodySchema = zod_1.z.strictObject({
    given_name: zod_1.z.string().trim().min(1),
    family_name: zod_1.z.string().nullable().optional(),
    date_of_birth: zod_1.z.string().regex(DOB_PATTERN).nullable().optional(),
    year_level: zod_1.z
        .number()
        .int()
        .min(students_list_1.OPS_STUDENT_YEAR_LEVEL_MIN)
        .max(students_list_1.OPS_STUDENT_YEAR_LEVEL_MAX)
        .nullable()
        .optional(),
    email: zod_1.z.string().nullable().optional(),
    first_language: zod_1.z.string().nullable().optional(),
    acara_phase: students_list_1.opsAcaraPhaseSchema.nullable().optional(),
    other_languages: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    l1_literate: zod_1.z.boolean().nullable().optional(),
    prior_schooling_interrupted: zod_1.z.boolean().nullable().optional(),
    time_learning_english_yrs: zod_1.z.number().nullable().optional(),
    time_in_australia_months: zod_1.z.number().int().nullable().optional(),
    class_documentId: core_1.documentIdSchema.optional(),
});
/**
 * C-OPS-STU-PATCH body — the create shape with EVERYTHING optional (a partial
 * edit: omitted = unchanged, null clears) and `class_documentId` nullable
 * (null unassigns the class). An EMPTY body is a client bug and a 400 on the
 * server, so the schema refuses it too rather than bless a silent no-op.
 */
exports.opsStudentUpdateBodySchema = zod_1.z
    .strictObject({
    given_name: zod_1.z.string().trim().min(1).optional(),
    family_name: zod_1.z.string().nullable().optional(),
    date_of_birth: zod_1.z.string().regex(DOB_PATTERN).nullable().optional(),
    year_level: zod_1.z
        .number()
        .int()
        .min(students_list_1.OPS_STUDENT_YEAR_LEVEL_MIN)
        .max(students_list_1.OPS_STUDENT_YEAR_LEVEL_MAX)
        .nullable()
        .optional(),
    email: zod_1.z.string().nullable().optional(),
    first_language: zod_1.z.string().nullable().optional(),
    acara_phase: students_list_1.opsAcaraPhaseSchema.nullable().optional(),
    other_languages: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    l1_literate: zod_1.z.boolean().nullable().optional(),
    prior_schooling_interrupted: zod_1.z.boolean().nullable().optional(),
    time_learning_english_yrs: zod_1.z.number().nullable().optional(),
    time_in_australia_months: zod_1.z.number().int().nullable().optional(),
    class_documentId: core_1.documentIdSchema.nullable().optional(),
})
    .refine((body) => Object.keys(body).length > 0, {
    message: 'an empty patch is not a valid edit',
});
/* ------------------------------------------------------------------ *
 * Responses and named operations
 * ------------------------------------------------------------------ */
exports.opsStudentCreateResponseSchema = (0, core_1.dataEnvelope)(exports.opsStudentDetailSchema);
exports.opsStudentUpdateResponseSchema = (0, core_1.dataEnvelope)(exports.opsStudentDetailSchema);
/** Single places that build the URLs, so no call site hand-concatenates them. */
function opsStudentCreatePath(schoolDocumentId) {
    return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students`;
}
function opsStudentUpdatePath(schoolDocumentId, studentDocumentId) {
    return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students/${encodeURIComponent(studentDocumentId)}`;
}
/** C-OPS-STU-CREATE — POST /api/ops/schools/{documentId}/students (ops). */
exports.OpsStudentCreateOperation = Object.freeze({
    contractId: 'C-OPS-STU-CREATE',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/students',
    request: exports.opsStudentCreateBodySchema,
    response: exports.opsStudentCreateResponseSchema,
    success: 201,
    errors: [400, 401, 403, 404, 429, 500],
});
/** C-OPS-STU-PATCH — PATCH /api/ops/schools/{documentId}/students/{studentDocumentId} (ops). */
exports.OpsStudentUpdateOperation = Object.freeze({
    contractId: 'C-OPS-STU-PATCH',
    method: 'PATCH',
    path: '/api/ops/schools/{documentId}/students/{studentDocumentId}',
    request: exports.opsStudentUpdateBodySchema,
    response: exports.opsStudentUpdateResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
