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
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';
import {
  OPS_STUDENT_YEAR_LEVEL_MAX,
  OPS_STUDENT_YEAR_LEVEL_MIN,
  opsAcaraPhaseSchema,
  opsStudentStatusSchema,
} from './students-list';

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
export const opsStudentDetailSchema = z.strictObject({
  documentId: documentIdSchema,
  given_name: z.string(),
  family_name: z.string().nullable(),
  email: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  year_level: z.number().int().nullable(),
  first_language: z.string().nullable(),
  acara_phase: z.string().nullable(),
  student_status: opsStudentStatusSchema,
  class: z
    .strictObject({ documentId: documentIdSchema, name: z.string().nullable() })
    .nullable(),
  school: z.strictObject({ documentId: documentIdSchema }).nullable(),
});
export type OpsStudentDetail = z.infer<typeof opsStudentDetailSchema>;

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
export const opsStudentCreateBodySchema = z.strictObject({
  given_name: z.string().trim().min(1),
  family_name: z.string().nullable().optional(),
  date_of_birth: z.string().regex(DOB_PATTERN).nullable().optional(),
  year_level: z
    .number()
    .int()
    .min(OPS_STUDENT_YEAR_LEVEL_MIN)
    .max(OPS_STUDENT_YEAR_LEVEL_MAX)
    .nullable()
    .optional(),
  email: z.string().nullable().optional(),
  first_language: z.string().nullable().optional(),
  acara_phase: opsAcaraPhaseSchema.nullable().optional(),
  other_languages: z.array(z.string()).nullable().optional(),
  l1_literate: z.boolean().nullable().optional(),
  prior_schooling_interrupted: z.boolean().nullable().optional(),
  time_learning_english_yrs: z.number().nullable().optional(),
  time_in_australia_months: z.number().int().nullable().optional(),
  class_documentId: documentIdSchema.optional(),
});
export type OpsStudentCreateBody = z.infer<typeof opsStudentCreateBodySchema>;

/**
 * C-OPS-STU-PATCH body — the create shape with EVERYTHING optional (a partial
 * edit: omitted = unchanged, null clears) and `class_documentId` nullable
 * (null unassigns the class). An EMPTY body is a client bug and a 400 on the
 * server, so the schema refuses it too rather than bless a silent no-op.
 */
export const opsStudentUpdateBodySchema = z
  .strictObject({
    given_name: z.string().trim().min(1).optional(),
    family_name: z.string().nullable().optional(),
    date_of_birth: z.string().regex(DOB_PATTERN).nullable().optional(),
    year_level: z
      .number()
      .int()
      .min(OPS_STUDENT_YEAR_LEVEL_MIN)
      .max(OPS_STUDENT_YEAR_LEVEL_MAX)
      .nullable()
      .optional(),
    email: z.string().nullable().optional(),
    first_language: z.string().nullable().optional(),
    acara_phase: opsAcaraPhaseSchema.nullable().optional(),
    other_languages: z.array(z.string()).nullable().optional(),
    l1_literate: z.boolean().nullable().optional(),
    prior_schooling_interrupted: z.boolean().nullable().optional(),
    time_learning_english_yrs: z.number().nullable().optional(),
    time_in_australia_months: z.number().int().nullable().optional(),
    class_documentId: documentIdSchema.nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'an empty patch is not a valid edit',
  });
export type OpsStudentUpdateBody = z.infer<typeof opsStudentUpdateBodySchema>;

/* ------------------------------------------------------------------ *
 * Responses and named operations
 * ------------------------------------------------------------------ */

export const opsStudentCreateResponseSchema = dataEnvelope(opsStudentDetailSchema);
export type OpsStudentCreateResponse = z.infer<typeof opsStudentCreateResponseSchema>;

export const opsStudentUpdateResponseSchema = dataEnvelope(opsStudentDetailSchema);
export type OpsStudentUpdateResponse = z.infer<typeof opsStudentUpdateResponseSchema>;

/** Single places that build the URLs, so no call site hand-concatenates them. */
export function opsStudentCreatePath(schoolDocumentId: string): string {
  return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students`;
}

export function opsStudentUpdatePath(
  schoolDocumentId: string,
  studentDocumentId: string,
): string {
  return `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students/${encodeURIComponent(studentDocumentId)}`;
}

/** C-OPS-STU-CREATE — POST /api/ops/schools/{documentId}/students (ops). */
export const OpsStudentCreateOperation: OpsOperation<
  typeof opsStudentCreateBodySchema,
  typeof opsStudentCreateResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-STU-CREATE',
  method: 'POST',
  path: '/api/ops/schools/{documentId}/students',
  request: opsStudentCreateBodySchema,
  response: opsStudentCreateResponseSchema,
  success: 201,
  errors: [400, 401, 403, 404, 429, 500],
});

/** C-OPS-STU-PATCH — PATCH /api/ops/schools/{documentId}/students/{studentDocumentId} (ops). */
export const OpsStudentUpdateOperation: OpsOperation<
  typeof opsStudentUpdateBodySchema,
  typeof opsStudentUpdateResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-STU-PATCH',
  method: 'PATCH',
  path: '/api/ops/schools/{documentId}/students/{studentDocumentId}',
  request: opsStudentUpdateBodySchema,
  response: opsStudentUpdateResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
