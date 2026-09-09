/**
 * OPS-062 — C-OPS-PORTAL-052 `GET /api/form-windows`.
 *
 * ONE portable definition of the school form-window READ, imported by the
 * Strapi projection, the typed web client and both HTTP suites so the shape
 * cannot drift between them.
 *
 * Two properties this module exists to guarantee, both named by the task:
 *  - ZERO rows means "no window". It is never an error and never an empty row.
 *  - MORE THAN ONE row for one school is an INTEGRITY error, never silently
 *    `rows[0]`: the storage rule is one window per school (replace semantics),
 *    so two rows mean no window is authoritative and the UI must say so.
 * A third, from the same storage reality: a window whose `school` or `form`
 * relation is gone (deleted form, cleared relation) is INCOMPLETE — reported,
 * not rendered as if a form were live.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const FORM_CODE_MAX = 255;
const MAX_PAGE = 100_000;
const MAX_COUNT = 2_147_483_647;

/** Contract bounds for the core pagination this operation accepts. */
export const FORM_WINDOW_READ_MAX_PAGE_SIZE = 200;
export const FORM_WINDOW_READ_DEFAULT_PAGE_SIZE = 25;
export const FORM_WINDOW_READ_PATH = '/api/form-windows';

/**
 * Strapi's core routes always add the legacy numeric `id` to a row and to every
 * populated relation. The contract identifies documents by `documentId` ALONE,
 * so the transport key is dropped here rather than being tolerated as an
 * unknown key — everything else still has to be exactly what was promised.
 */
function withoutLegacyId(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const { id: _legacyId, ...rest } = value as Record<string, unknown>;
  return rest;
}

const strictRow = <T extends z.ZodRawShape>(shape: T) =>
  z.preprocess(withoutLegacyId, z.strictObject(shape));

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'must be an ISO date-time' });

export const formWindowSchoolRefSchema = strictRow({ documentId: documentIdSchema });
export const formWindowFormRefSchema = strictRow({
  documentId: documentIdSchema,
  form_code: z.string().min(1).max(FORM_CODE_MAX),
});

/** The contracted Window: both relations present, exactly five keys. */
export const formWindowRowSchema = strictRow({
  documentId: documentIdSchema,
  school: formWindowSchoolRefSchema,
  form: formWindowFormRefSchema,
  opens_at: isoDateTime,
  closes_at: isoDateTime,
});
export type FormWindowRow = z.infer<typeof formWindowRowSchema>;

/**
 * The same row as it can actually arrive. A relation that was deleted comes
 * back as `null`, and a parser that refused it would turn a recoverable data
 * problem into an unreadable screen; `resolveSchoolFormWindow` classifies it.
 */
export const formWindowWireRowSchema = strictRow({
  documentId: documentIdSchema,
  school: formWindowSchoolRefSchema.nullable(),
  form: formWindowFormRefSchema.nullable(),
  opens_at: isoDateTime,
  closes_at: isoDateTime,
});
export type FormWindowWireRow = z.infer<typeof formWindowWireRowSchema>;

export const formWindowPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(MAX_PAGE),
  pageSize: z.number().int().min(1).max(FORM_WINDOW_READ_MAX_PAGE_SIZE),
  pageCount: z.number().int().min(0).max(MAX_COUNT),
  total: z.number().int().min(0).max(MAX_COUNT),
});
export type FormWindowPagination = z.infer<typeof formWindowPaginationSchema>;

/** 200 body: the page of rows plus the core list metadata, both preserved. */
export const formWindowListSchema = z.strictObject({
  data: z.array(formWindowWireRowSchema).max(FORM_WINDOW_READ_MAX_PAGE_SIZE),
  meta: z.strictObject({ pagination: formWindowPaginationSchema }),
});
export type FormWindowList = z.infer<typeof formWindowListSchema>;

/** GET carries no body; an empty object is the only valid payload. */
export const formWindowReadBodySchema = z.strictObject({});

/**
 * The EXACT query a portal read sends: the school filter the operation is
 * scoped by, the explicit school/form population, and bounded core pagination.
 * Built here so the client, the server assertions and the suites cannot
 * disagree about a single bracket.
 */
export function formWindowReadParams(schoolDocumentId: string): Record<string, string | number> {
  return {
    'filters[school][documentId][$eq]': schoolDocumentId,
    'populate[school][fields][0]': 'documentId',
    'populate[form][fields][0]': 'form_code',
    'pagination[page]': 1,
    'pagination[pageSize]': FORM_WINDOW_READ_DEFAULT_PAGE_SIZE,
  };
}

/**
 * What the school's rows mean. `conflict` and `incomplete` exist so a caller
 * physically cannot express "just take the first row": the union has no member
 * that hands back a window when the data does not support one.
 */
export type FormWindowResolution =
  | { readonly kind: 'none' }
  | { readonly kind: 'one'; readonly window: FormWindowRow }
  | { readonly kind: 'incomplete'; readonly documentId: string }
  | { readonly kind: 'conflict'; readonly documentIds: readonly string[] };

export function resolveSchoolFormWindow(
  rows: readonly FormWindowWireRow[],
): FormWindowResolution {
  if (rows.length === 0) return { kind: 'none' };
  if (rows.length > 1) {
    return { kind: 'conflict', documentIds: rows.map((row) => row.documentId) };
  }
  const row = rows[0];
  if (row.school === null || row.form === null) {
    return { kind: 'incomplete', documentId: row.documentId };
  }
  return {
    kind: 'one',
    window: {
      documentId: row.documentId,
      school: row.school,
      form: row.form,
      opens_at: row.opens_at,
      closes_at: row.closes_at,
    },
  };
}

/** C-OPS-PORTAL-052 — GET /api/form-windows */
export const FormWindowReadOperation: OpsOperation<
  typeof formWindowReadBodySchema,
  typeof formWindowListSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-052',
  method: 'GET',
  path: FORM_WINDOW_READ_PATH,
  request: formWindowReadBodySchema,
  response: formWindowListSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
