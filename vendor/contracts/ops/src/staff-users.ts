/**
 * OPS-025 — C-OPS-PORTAL-015 `GET /api/ops/users`.
 *
 * ONE definition of the staff directory read, imported by the Strapi
 * projection, the typed web query and both HTTP suites, so the Admins and
 * Teachers surfaces cannot drift from the server that feeds them.
 *
 * Two shapes live here on purpose:
 *  - `legacyStaffUserRowSchema` is the EXACT unversioned row the endpoint has
 *    served since C-OPSU-01. A caller that omits `X-Ops-Portal-Version` keeps
 *    it byte for byte (D-COMPAT), so this file is also the regression fence.
 *  - `staffUserRowSchema` is the versioned portal row: the legacy keys plus
 *    `updatedAt`, `display_name`, `teaching_specialty` and `last_active_at`.
 *
 * `last_active_at` is a REAL authenticated-login timestamp (up_users
 * `last_active_at`, stamped by the login wrap). It is null for every account
 * that has not signed in since the column existed — never derived from
 * `createdAt`, which would manufacture history the system never observed.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const EMAIL_MAX = 255;
const NAME_MAX = 100;
const SCHOOL_NAME_MAX = 255;
const DISPLAY_NAME_MAX = 200;
const SPECIALTY_MAX = 120;
const QUERY_MAX = 120;

export const PAGE_MIN = 1;
export const PAGE_MAX = 100_000;
export const PAGE_SIZE_MIN = 1;
export const PAGE_SIZE_DEFAULT = 25;
export const PAGE_SIZE_MAX = 200;

const timestampSchema = z.iso.datetime({ offset: true });

/**
 * The portal role vocabulary. `ops_support` is contracted but has no seeded
 * users-permissions role on this stack yet, so filtering by it legitimately
 * returns zero rows — it never widens what a caller may read.
 */
export const STAFF_USER_ROLES = [
  'ops',
  'school_admin',
  'teacher',
  'parent',
  'student',
  'ops_support',
] as const;
export const staffUserRoleSchema = z.enum(STAFF_USER_ROLES);
export type StaffUserRole = z.infer<typeof staffUserRoleSchema>;

/** The five roles the UNVERSIONED endpoint has always accepted in `?role=`. */
export const LEGACY_STAFF_USER_ROLES = [
  'ops',
  'school_admin',
  'teacher',
  'parent',
  'student',
] as const;
export type LegacyStaffUserRole = (typeof LEGACY_STAFF_USER_ROLES)[number];

export const staffPaginationSchema = z.strictObject({
  page: z.number().int().min(PAGE_MIN).max(PAGE_MAX),
  pageSize: z.number().int().min(PAGE_SIZE_MIN).max(PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type StaffPagination = z.infer<typeof staffPaginationSchema>;

export const staffSchoolRefSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().max(SCHOOL_NAME_MAX).nullable(),
});
export type StaffSchoolRef = z.infer<typeof staffSchoolRefSchema>;

/** The unversioned projection — ten keys, unchanged since C-OPSU-01. */
export const legacyStaffUserRowSchema = z.strictObject({
  documentId: documentIdSchema,
  email: z.string().max(EMAIL_MAX).nullable(),
  username: z.string().max(EMAIL_MAX).nullable(),
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  role: z.string().nullable(),
  blocked: z.boolean(),
  confirmed: z.boolean(),
  school: staffSchoolRefSchema.nullable(),
  createdAt: timestampSchema.nullable(),
});
export type LegacyStaffUserRow = z.infer<typeof legacyStaffUserRowSchema>;

/** The versioned portal projection. Every key is always present, nulls included. */
export const staffUserRowSchema = z.strictObject({
  documentId: documentIdSchema,
  email: z.string().max(EMAIL_MAX).nullable(),
  username: z.string().max(EMAIL_MAX).nullable(),
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  role: staffUserRoleSchema.nullable(),
  blocked: z.boolean(),
  confirmed: z.boolean(),
  school: staffSchoolRefSchema.nullable(),
  createdAt: timestampSchema.nullable(),
  updatedAt: timestampSchema,
  display_name: z.string().max(DISPLAY_NAME_MAX).nullable(),
  teaching_specialty: z.string().max(SPECIALTY_MAX).nullable(),
  last_active_at: timestampSchema.nullable(),
});
export type StaffUserRow = z.infer<typeof staffUserRowSchema>;

export const staffUsersQuerySchema = z.strictObject({
  page: z.number().int().min(PAGE_MIN).max(PAGE_MAX).optional(),
  pageSize: z.number().int().min(PAGE_SIZE_MIN).max(PAGE_SIZE_MAX).optional(),
  q: z.string().max(QUERY_MAX).optional(),
  school: documentIdSchema.optional(),
  role: staffUserRoleSchema.optional(),
  blocked: z.boolean().optional(),
  confirmed: z.boolean().optional(),
});
export type StaffUsersQuery = z.infer<typeof staffUsersQuerySchema>;

export const staffUsersResponseSchema = z.strictObject({
  data: z.array(staffUserRowSchema).max(PAGE_SIZE_MAX),
  meta: z.strictObject({ pagination: staffPaginationSchema }),
});
export type StaffUsersResponse = z.infer<typeof staffUsersResponseSchema>;

export const legacyStaffUsersResponseSchema = z.object({
  data: z.array(legacyStaffUserRowSchema).max(PAGE_SIZE_MAX),
  meta: z.object({ pagination: staffPaginationSchema }),
});

export const StaffUsersOperation: OpsOperation<
  typeof staffUsersQuerySchema,
  typeof staffUsersResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-015',
  method: 'GET',
  path: '/api/ops/users',
  request: staffUsersQuerySchema,
  response: staffUsersResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/* ------------------------------------------------------------------ *
 * Row identity.
 *
 * The Admins/Teachers tables show accepted accounts (this operation) beside
 * pending invitations (C-OPS-PORTAL-016, its own read). Both carry a
 * documentId from a DIFFERENT table, so a bare documentId is NOT unique across
 * the merged list. Every row therefore carries a discriminated identity —
 * `user:<documentId>` or `invitation:<documentId>` — which is also the React
 * key and the selection key. A display name is never an identifier.
 * ------------------------------------------------------------------ */

export const STAFF_ROW_KINDS = ['user', 'invitation'] as const;
export const staffRowKindSchema = z.enum(STAFF_ROW_KINDS);
export type StaffRowKind = z.infer<typeof staffRowKindSchema>;

export interface StaffRowIdentity {
  kind: StaffRowKind;
  documentId: string;
}

export function staffRowId(identity: StaffRowIdentity): string {
  return `${identity.kind}:${identity.documentId}`;
}

export function parseStaffRowId(value: string): StaffRowIdentity | null {
  const separator = value.indexOf(':');
  if (separator <= 0) return null;
  const kind = staffRowKindSchema.safeParse(value.slice(0, separator));
  const documentId = documentIdSchema.safeParse(value.slice(separator + 1));
  if (!kind.success || !documentId.success) return null;
  return { kind: kind.data, documentId: documentId.data };
}

/**
 * The single pictured name input, rebuilt losslessly from the stored parts.
 * Returns null rather than an empty string when the account has neither name,
 * so the caller renders its own no-value fallback instead of a blank cell.
 */
export function staffDisplayName(parts: {
  first_name: string | null;
  last_name: string | null;
}): string | null {
  const joined = [parts.first_name ?? '', parts.last_name ?? ''].join(' ').trim();
  return joined.length > 0 ? joined.slice(0, DISPLAY_NAME_MAX) : null;
}

/**
 * The inverse of `staffDisplayName`: what the single pictured Name control
 * stores.
 *
 * The whole typed string goes into `first_name` and `last_name` is emptied.
 * That is lossless rather than lazy — `staffDisplayName` joins the two parts
 * and drops the empty one, so the exact string the operator typed comes back.
 * The alternative is splitting on a space to guess which word is the surname,
 * which D-NAME forbids ("Do not guess surnames") and which silently renames
 * real people: "van der Berg" and "Maria Teresa" both lose.
 *
 * The cap is the SAME constant the join applies, so a stored name can never be
 * longer than what the read side is willing to render — otherwise the value
 * would round-trip truncated and the control would not be lossless after all.
 *
 * Defined here, beside its inverse, because an invitation and an account are
 * the same person at two moments: the invite parser and the account editor
 * must not each keep their own idea of how a name is stored.
 */
export function splitStaffDisplayName(displayName: string): {
  first_name: string;
  last_name: string;
} {
  return { first_name: displayName.trim().slice(0, DISPLAY_NAME_MAX), last_name: '' };
}
