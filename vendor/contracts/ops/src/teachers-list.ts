/**
 * C-OPS-PORTAL-021 — `GET /api/ops/schools/{documentId}/teachers` (OPS-031).
 *
 * ONE portable definition of the ops staff-directory read, imported by the
 * Strapi handler that serves it, by the web client that consumes it and by the
 * Playwright suites on both sides, so the wire shape cannot drift.
 *
 * TWO contracts live behind one path, selected by the D-COMPAT version header
 * and nothing else (the header carries no authority — see ./compatibility):
 *
 *  - LEGACY (no `X-Ops-Portal-Version`) — `teachersLegacyRowSchema[]` inside a
 *    bare `{ data }`. This is the OBSERVED baseline the existing ops teacher
 *    dialog already receives: the COMPLETE array (never paginated), staff of
 *    both `teacher` and `school_admin` role, and `classes` grouped by the
 *    LEGACY PRIMARY teacher relation ONLY (`class.teacher`). Preserved keystroke
 *    for keystroke; a new key here would break a shipped consumer.
 *
 *  - VERSIONED (`X-Ops-Portal-Version: 1`) — `teachersListResponseSchema`:
 *    `{ data: teacherPortalRowSchema[], meta: { pagination } }` with the `q`,
 *    `role` and `blocked` filters applied IN THE QUERY (so a search reaches
 *    every eligible candidate instead of filtering one truncated page), and the
 *    class membership RECONCILED once — see `mergeTeacherClassRefs`.
 *
 * CLASS-MEMBERSHIP COUNTS, stated once so no reader has to guess:
 *  - `class.teacher`  (manyToOne)   = the PRIMARY teacher of the class. Exactly
 *    one per class, and the only membership the legacy projection counts.
 *  - `class.teachers` (manyToMany)  = CO-TEACHERS. Zero or more per class.
 *  - `teacherPortalRow.classes`     = the UNION of both, de-duplicated by
 *    `documentId`. A teacher who is both primary and co-teacher of the same
 *    class appears ONCE. So `classes.length` is "classes this teacher is
 *    attached to in any capacity" — it is NOT a count of classes they own, and
 *    summing it across teachers double-counts co-taught classes.
 *
 * Every object is strict: a key the contract never promised fails the parse
 * instead of being silently accepted inbound or leaked outbound.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const CLASS_NAME_MAX = 255;
const EMAIL_MAX = 255;
const NAME_MAX = 100;
const DISPLAY_NAME_MAX = 200;
const SPECIALTY_MAX = 120;
const QUERY_MAX = 120;
const PAGE_MAX = 100_000;
const PAGE_SIZE_MAX = 200;
const INT32_MAX = 2_147_483_647;
const CLASSES_MAX = 1000;

/** ISO-8601 instant exactly as Strapi serialises a timestamp column. */
export const opsTimestampSchema = z.iso.datetime();

/**
 * A class a teacher is attached to. `name` is nullable and is NEVER an
 * identity: the relation is keyed on `documentId`, so two classes that share a
 * label stay distinguishable.
 */
export const teacherClassRefSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(CLASS_NAME_MAX).nullable(),
});
export type TeacherClassRef = z.infer<typeof teacherClassRefSchema>;

/** The unversioned row, frozen as observed. Six keys, primary classes only. */
export const teachersLegacyRowSchema = z.strictObject({
  documentId: documentIdSchema,
  email: z.string().max(EMAIL_MAX).nullable(),
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  blocked: z.boolean(),
  classes: z.array(teacherClassRefSchema).max(CLASSES_MAX),
});
export type TeachersLegacyRow = z.infer<typeof teachersLegacyRowSchema>;

/**
 * The versioned row. Adds the four portal fields on top of the legacy six:
 *  - `updatedAt`          — the row's own Strapi timestamp, for optimistic UI.
 *  - `display_name`       — a LABEL built from the stored names. Presentation
 *                           only; never a key, never a lookup value.
 *  - `teaching_specialty` — the stored specialty, `null` when the account has
 *                           none recorded. Never inferred from a name.
 *  - `last_active_at`     — the newest authenticated-session fact recorded for
 *                           this teacher, `null` when none exists. Never
 *                           substituted with `createdAt`.
 */
export const teacherPortalRowSchema = z.strictObject({
  documentId: documentIdSchema,
  email: z.string().max(EMAIL_MAX).nullable(),
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  blocked: z.boolean(),
  classes: z.array(teacherClassRefSchema).max(CLASSES_MAX),
  updatedAt: opsTimestampSchema,
  display_name: z.string().max(DISPLAY_NAME_MAX).nullable(),
  teaching_specialty: z.string().max(SPECIALTY_MAX).nullable(),
  last_active_at: opsTimestampSchema.nullable(),
});
export type TeacherPortalRow = z.infer<typeof teacherPortalRowSchema>;

export const teachersListPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(PAGE_MAX),
  pageSize: z.number().int().min(1).max(PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0).max(INT32_MAX),
  total: z.number().int().min(0).max(INT32_MAX),
});
export type TeachersListPagination = z.infer<typeof teachersListPaginationSchema>;

/** The staff roles this directory serves. Never widened by a query param. */
export const teacherRoleSchema = z.enum(['teacher', 'school_admin']);
export type TeacherRoleFilter = z.infer<typeof teacherRoleSchema>;

/**
 * The versioned query string, post-coercion. The server parses the raw strings
 * itself (an out-of-range page is a 400, never a silent clamp) and validates
 * the parsed result against this schema before any business logic runs.
 */
export const teachersListQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(PAGE_MAX).optional(),
  pageSize: z.number().int().min(1).max(PAGE_SIZE_MAX).optional(),
  q: z.string().min(1).max(QUERY_MAX).optional(),
  role: teacherRoleSchema.optional(),
  blocked: z.boolean().optional(),
});
export type TeachersListQuery = z.infer<typeof teachersListQuerySchema>;

export const teachersListResponseSchema = z.strictObject({
  data: z.array(teacherPortalRowSchema).max(PAGE_SIZE_MAX),
  meta: z.strictObject({ pagination: teachersListPaginationSchema }),
});
export type TeachersListResponse = z.infer<typeof teachersListResponseSchema>;

/** The legacy body: a bare `{ data }` with the complete, unpaginated array. */
export const teachersLegacyResponseSchema = z.strictObject({
  data: z.array(teachersLegacyRowSchema),
});
export type TeachersLegacyResponse = z.infer<typeof teachersLegacyResponseSchema>;

/**
 * The ONE reconciliation of the two class relations, shared by the server that
 * projects it and the tests that assert it, so "which classes is this teacher
 * on" has a single answer.
 *
 * Union of primary and co-teacher membership, de-duplicated by `documentId`
 * (first occurrence wins, so a primary row keeps its name), then ordered by
 * `name` and tie-broken on `documentId` — never on the display label alone,
 * which is not unique.
 */
export function mergeTeacherClassRefs(
  primary: readonly TeacherClassRef[],
  coTeaching: readonly TeacherClassRef[],
): TeacherClassRef[] {
  const byDocumentId = new Map<string, TeacherClassRef>();
  for (const ref of [...primary, ...coTeaching]) {
    if (!byDocumentId.has(ref.documentId)) byDocumentId.set(ref.documentId, ref);
  }
  return [...byDocumentId.values()].sort((a, b) => {
    const left = a.name ?? '';
    const right = b.name ?? '';
    if (left !== right) return left < right ? -1 : 1;
    return a.documentId < b.documentId ? -1 : 1;
  });
}

/**
 * A presentation label built from the stored names. Returns `null` — never the
 * email, never invented text — when no name is stored, so the UI renders its
 * own empty fallback instead of guessing one.
 */
export function teacherDisplayName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  const joined = [firstName ?? '', lastName ?? ''].join(' ').trim();
  return joined.length === 0 ? null : joined.slice(0, DISPLAY_NAME_MAX);
}

/** C-OPS-PORTAL-021 — GET /api/ops/schools/{documentId}/teachers */
export const TeachersListOperation: OpsOperation<
  typeof teachersListQuerySchema,
  typeof teachersListResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-021',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/teachers',
  request: teachersListQuerySchema,
  response: teachersListResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});
