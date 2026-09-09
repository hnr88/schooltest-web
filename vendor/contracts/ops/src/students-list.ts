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

import { documentIdSchema, type OpsOperation } from './core';

/* ------------------------------------------------------------------ *
 * Bounds — the exact numbers the server validates and the tests assert.
 * ------------------------------------------------------------------ */

/** api::student.student `status` enum, stored verbatim. `enrolled` is the
 *  roster row that has not finished setup; the UI labels it "Pending setup"
 *  but the wire value is never renamed. */
export const OPS_STUDENT_STATUSES = ['active', 'archived', 'enrolled'] as const;
export const opsStudentStatusSchema = z.enum(OPS_STUDENT_STATUSES);
export type OpsStudentStatus = z.infer<typeof opsStudentStatusSchema>;

/** api::student.student `acara_phase` enum. */
export const OPS_ACARA_PHASES = [
  'beginning',
  'emerging',
  'developing',
  'consolidating',
] as const;
export const opsAcaraPhaseSchema = z.enum(OPS_ACARA_PHASES);
export type OpsAcaraPhase = z.infer<typeof opsAcaraPhaseSchema>;

export const OPS_STUDENT_YEAR_LEVEL_MIN = 7;
export const OPS_STUDENT_YEAR_LEVEL_MAX = 12;
export const OPS_STUDENTS_PAGE_MAX = 100_000;
export const OPS_STUDENTS_PAGE_SIZE_DEFAULT = 25;
export const OPS_STUDENTS_PAGE_SIZE_MAX = 200;
export const OPS_STUDENTS_QUERY_MAX = 120;

const CLASS_NAME_MAX = 255;
const GIVEN_NAME_MAX = 100;
const FAMILY_NAME_MAX = 100;
const FIRST_LANGUAGE_MAX = 100;
const CEFR_LEVEL_MAX = 10;
const COUNT_MAX = 2_147_483_647;

/* ------------------------------------------------------------------ *
 * Row projection
 * ------------------------------------------------------------------ */

export const opsStudentClassRefSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(CLASS_NAME_MAX).nullable(),
});
export type OpsStudentClassRef = z.infer<typeof opsStudentClassRefSchema>;

/**
 * The student's latest OFFICIAL, complete, non-invalidated skill result.
 * `cefr_level` is the stored crosswalk band (null while a result carries none)
 * and `percentage` is the proportion-correct score of that sitting rescaled to
 * 0..100 — null when the sitting has no server-scored evidence yet, and 0 when
 * the student genuinely scored nothing.
 */
export const opsStudentLatestResultSchema = z.strictObject({
  documentId: documentIdSchema,
  cefr_level: z.string().max(CEFR_LEVEL_MAX).nullable(),
  percentage: z.number().min(0).max(100).nullable(),
  completed_at: z.iso.datetime(),
});
export type OpsStudentLatestResult = z.infer<typeof opsStudentLatestResultSchema>;

export const opsStudentRowSchema = z.strictObject({
  documentId: documentIdSchema,
  given_name: z.string().min(1).max(GIVEN_NAME_MAX),
  // A mononym is ordinary (M-CT-STUDENT-NAME): family_name is nullable and the
  // row must never synthesise one.
  family_name: z.string().max(FAMILY_NAME_MAX).nullable(),
  year_level: z
    .number()
    .int()
    .min(OPS_STUDENT_YEAR_LEVEL_MIN)
    .max(OPS_STUDENT_YEAR_LEVEL_MAX)
    .nullable(),
  first_language: z.string().max(FIRST_LANGUAGE_MAX).nullable(),
  acara_phase: opsAcaraPhaseSchema.nullable(),
  status: opsStudentStatusSchema,
  class: opsStudentClassRefSchema.nullable(),
  latest_result: opsStudentLatestResultSchema.nullable(),
  updatedAt: z.iso.datetime(),
});
export type OpsStudentRow = z.infer<typeof opsStudentRowSchema>;

export const opsStudentsPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(OPS_STUDENTS_PAGE_MAX),
  pageSize: z.number().int().min(1).max(OPS_STUDENTS_PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0).max(COUNT_MAX),
  total: z.number().int().min(0).max(COUNT_MAX),
});
export type OpsStudentsPagination = z.infer<typeof opsStudentsPaginationSchema>;

/* ------------------------------------------------------------------ *
 * Request
 * ------------------------------------------------------------------ */

/**
 * The decoded query. HTTP delivers strings; `page`, `pageSize` and `year_level`
 * decode ONCE to integers here, so a value outside the bounds is a 400 rather
 * than a silent clamp. `class` must be a class of the school in the path.
 */
export const opsStudentsListQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(OPS_STUDENTS_PAGE_MAX).optional(),
  pageSize: z.number().int().min(1).max(OPS_STUDENTS_PAGE_SIZE_MAX).optional(),
  q: z.string().max(OPS_STUDENTS_QUERY_MAX).optional(),
  status: opsStudentStatusSchema.optional(),
  class: documentIdSchema.optional(),
  year_level: z
    .number()
    .int()
    .min(OPS_STUDENT_YEAR_LEVEL_MIN)
    .max(OPS_STUDENT_YEAR_LEVEL_MAX)
    .optional(),
});
export type OpsStudentsListQuery = z.infer<typeof opsStudentsListQuerySchema>;

export const opsStudentsListResponseSchema = z.strictObject({
  data: z.array(opsStudentRowSchema).max(OPS_STUDENTS_PAGE_SIZE_MAX),
  meta: z.strictObject({ pagination: opsStudentsPaginationSchema }),
});
export type OpsStudentsListResponse = z.infer<typeof opsStudentsListResponseSchema>;

/**
 * The one encoder for this operation's query — client and tests share it, so an
 * omitted filter is an ABSENT key rather than an empty value, and no caller
 * invents a second spelling of `year_level`. Written with plain string pairs
 * (no URLSearchParams) because this package targets ES2020 with no DOM/node lib.
 */
export function opsStudentsListQueryString(query: OpsStudentsListQuery): string {
  const pairs: [string, string][] = [];
  if (query.page !== undefined) pairs.push(['page', String(query.page)]);
  if (query.pageSize !== undefined) pairs.push(['pageSize', String(query.pageSize)]);
  if (query.q !== undefined && query.q !== '') pairs.push(['q', query.q]);
  if (query.status !== undefined) pairs.push(['status', query.status]);
  if (query.class !== undefined) pairs.push(['class', query.class]);
  if (query.year_level !== undefined) pairs.push(['year_level', String(query.year_level)]);
  return pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/** `/api/ops/schools/{documentId}/students` with the encoded query appended. */
export function opsStudentsListPath(
  schoolDocumentId: string,
  query: OpsStudentsListQuery = {},
): string {
  const search = opsStudentsListQueryString(query);
  const base = `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/students`;
  return search === '' ? base : `${base}?${search}`;
}

export const StudentsListOperation: OpsOperation<
  typeof opsStudentsListQuerySchema,
  typeof opsStudentsListResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-035',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/students',
  request: opsStudentsListQuerySchema,
  response: opsStudentsListResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
