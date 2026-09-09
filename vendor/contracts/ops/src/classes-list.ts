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
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';

const NAME_MAX = 255;
const PERSON_NAME_MAX = 100;
const YEAR_BAND_MAX = 50;
const QUERY_MAX = 120;
const MAX_PAGE = 100_000;
const MAX_PAGE_SIZE = 200;
const MAX_TEACHERS_PER_CLASS = 100;
const INT32_MAX = 2_147_483_647;

/** Strapi serialises every datetime as an ISO-8601 instant. */
export const timestampSchema = z.iso.datetime({ offset: true });

/** The three states the Classes tab's filter chips select between. */
export const classListStatusSchema = z.enum(['active', 'pending_setup', 'archived']);
export type ClassListStatus = z.infer<typeof classListStatusSchema>;

/** The two orderings the tab offers; anything else is a 400 server-side. */
export const classListSortSchema = z.enum(['name:asc', 'student_count:desc']);
export type ClassListSort = z.infer<typeof classListSortSchema>;

export const classTeacherRefSchema = z.strictObject({
  documentId: documentIdSchema,
  first_name: z.string().max(PERSON_NAME_MAX).nullable(),
  last_name: z.string().max(PERSON_NAME_MAX).nullable(),
});
export type ClassTeacherRef = z.infer<typeof classTeacherRefSchema>;

export const classSchoolRefSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(NAME_MAX).nullable(),
});
export type ClassSchoolRef = z.infer<typeof classSchoolRefSchema>;

/**
 * The school's live form window, echoed on every class of that school. The
 * product stores ONE window per school (api::form-window, replace semantics),
 * so this is the real window a class's students sit — not a per-class field
 * invented to fill the design's `{year} · {window}` subtitle.
 */
export const classTestWindowSchema = z.strictObject({
  documentId: documentIdSchema,
  title: z.string().min(1).max(NAME_MAX),
  opens_at: timestampSchema,
  closes_at: timestampSchema,
});
export type ClassTestWindow = z.infer<typeof classTestWindowSchema>;

export const classRowSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(NAME_MAX).nullable(),
  year_band: z.string().max(YEAR_BAND_MAX).nullable(),
  teachers: z.array(classTeacherRefSchema).max(MAX_TEACHERS_PER_CLASS),
  student_count: z.number().int().min(0).max(INT32_MAX),
  archived_at: timestampSchema.nullable(),
  school: classSchoolRefSchema,
  primary_teacher: classTeacherRefSchema.nullable(),
  updatedAt: timestampSchema,
  test_window: classTestWindowSchema.nullable(),
});
export type ClassRow = z.infer<typeof classRowSchema>;

export const classesListPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(MAX_PAGE),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
  pageCount: z.number().int().min(0).max(INT32_MAX),
  total: z.number().int().min(0).max(INT32_MAX),
});
export type ClassesListPagination = z.infer<typeof classesListPaginationSchema>;

/**
 * The accepted query string. Strict: an unknown key is a caller mistake, and
 * silently ignoring it would hand back an unfiltered page that looks filtered.
 */
export const classesListQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(MAX_PAGE).optional(),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  q: z.string().max(QUERY_MAX).optional(),
  status: classListStatusSchema.optional(),
  teacher: documentIdSchema.optional(),
  year_band: z.string().max(YEAR_BAND_MAX).optional(),
  sort: classListSortSchema.optional(),
});
export type ClassesListQuery = z.infer<typeof classesListQuerySchema>;

/** 200 body — `{ data, meta }`, unlike the single-object `{ data }` envelope. */
export const classesListResponseSchema = z.strictObject({
  data: z.array(classRowSchema).max(MAX_PAGE_SIZE),
  meta: z.strictObject({ pagination: classesListPaginationSchema }),
});
export type ClassesListResponse = z.infer<typeof classesListResponseSchema>;

/** The empty request body: this operation is a GET and accepts none. */
export const classesListRequestSchema = z.strictObject({});

/**
 * THE status rule, in one place. `archived_at` wins outright; a class with no
 * primary teacher is still being set up; everything else is active.
 */
export function classRowStatus(row: Pick<ClassRow, 'archived_at' | 'primary_teacher'>): ClassListStatus {
  if (row.archived_at !== null) return 'archived';
  if (row.primary_teacher === null) return 'pending_setup';
  return 'active';
}

/**
 * Build the query string for one request. Kept here rather than in the web
 * client so the keys the server parses and the keys the client sends are the
 * same literals. Undefined/empty values are dropped, never sent as "".
 */
export function classesListQueryParams(query: ClassesListQuery): Record<string, string> {
  const parsed = classesListQuerySchema.parse(query);
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined || value === '') continue;
    params[key] = String(value);
  }
  return params;
}

/** Path of the operation for one school. */
export function classesListPath(schoolDocumentId: string): string {
  return `/api/ops/schools/${documentIdSchema.parse(schoolDocumentId)}/classes`;
}

/**
 * C-OPS-PORTAL-028. `response` is the full `{ data, meta }` body; the plain
 * `dataEnvelope` is re-used only for the row-level assertions a caller may
 * want, so the shared helper stays the one envelope definition.
 */
export const ClassesListOperation: OpsOperation<
  typeof classesListRequestSchema,
  typeof classesListResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-028',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/classes',
  request: classesListRequestSchema,
  response: classesListResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/** `{ data: ClassRow }` — used when a single row is read back for assertions. */
export const classRowEnvelopeSchema = dataEnvelope(classRowSchema);
