"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffRowKindSchema = exports.STAFF_ROW_KINDS = exports.StaffUsersOperation = exports.legacyStaffUsersResponseSchema = exports.staffUsersResponseSchema = exports.staffUsersQuerySchema = exports.staffUserRowSchema = exports.legacyStaffUserRowSchema = exports.staffSchoolRefSchema = exports.staffPaginationSchema = exports.LEGACY_STAFF_USER_ROLES = exports.staffUserRoleSchema = exports.STAFF_USER_ROLES = exports.PAGE_SIZE_MAX = exports.PAGE_SIZE_DEFAULT = exports.PAGE_SIZE_MIN = exports.PAGE_MAX = exports.PAGE_MIN = void 0;
exports.staffRowId = staffRowId;
exports.parseStaffRowId = parseStaffRowId;
exports.staffDisplayName = staffDisplayName;
exports.splitStaffDisplayName = splitStaffDisplayName;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const EMAIL_MAX = 255;
const NAME_MAX = 100;
const SCHOOL_NAME_MAX = 255;
const DISPLAY_NAME_MAX = 200;
const SPECIALTY_MAX = 120;
const QUERY_MAX = 120;
exports.PAGE_MIN = 1;
exports.PAGE_MAX = 100000;
exports.PAGE_SIZE_MIN = 1;
exports.PAGE_SIZE_DEFAULT = 25;
exports.PAGE_SIZE_MAX = 200;
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
/**
 * The portal role vocabulary. `ops_support` is contracted but has no seeded
 * users-permissions role on this stack yet, so filtering by it legitimately
 * returns zero rows — it never widens what a caller may read.
 */
exports.STAFF_USER_ROLES = [
    'ops',
    'school_admin',
    'teacher',
    'parent',
    'student',
    'ops_support',
];
exports.staffUserRoleSchema = zod_1.z.enum(exports.STAFF_USER_ROLES);
/** The five roles the UNVERSIONED endpoint has always accepted in `?role=`. */
exports.LEGACY_STAFF_USER_ROLES = [
    'ops',
    'school_admin',
    'teacher',
    'parent',
    'student',
];
exports.staffPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.PAGE_MIN).max(exports.PAGE_MAX),
    pageSize: zod_1.z.number().int().min(exports.PAGE_SIZE_MIN).max(exports.PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0),
    total: zod_1.z.number().int().min(0),
});
exports.staffSchoolRefSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(SCHOOL_NAME_MAX).nullable(),
});
/** The unversioned projection — ten keys, unchanged since C-OPSU-01. */
exports.legacyStaffUserRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    email: zod_1.z.string().max(EMAIL_MAX).nullable(),
    username: zod_1.z.string().max(EMAIL_MAX).nullable(),
    first_name: zod_1.z.string().max(NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(NAME_MAX).nullable(),
    role: zod_1.z.string().nullable(),
    blocked: zod_1.z.boolean(),
    confirmed: zod_1.z.boolean(),
    school: exports.staffSchoolRefSchema.nullable(),
    createdAt: timestampSchema.nullable(),
});
/** The versioned portal projection. Every key is always present, nulls included. */
exports.staffUserRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    email: zod_1.z.string().max(EMAIL_MAX).nullable(),
    username: zod_1.z.string().max(EMAIL_MAX).nullable(),
    first_name: zod_1.z.string().max(NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(NAME_MAX).nullable(),
    role: exports.staffUserRoleSchema.nullable(),
    blocked: zod_1.z.boolean(),
    confirmed: zod_1.z.boolean(),
    school: exports.staffSchoolRefSchema.nullable(),
    createdAt: timestampSchema.nullable(),
    updatedAt: timestampSchema,
    display_name: zod_1.z.string().max(DISPLAY_NAME_MAX).nullable(),
    teaching_specialty: zod_1.z.string().max(SPECIALTY_MAX).nullable(),
    last_active_at: timestampSchema.nullable(),
});
exports.staffUsersQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(exports.PAGE_MIN).max(exports.PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(exports.PAGE_SIZE_MIN).max(exports.PAGE_SIZE_MAX).optional(),
    q: zod_1.z.string().max(QUERY_MAX).optional(),
    school: core_1.documentIdSchema.optional(),
    role: exports.staffUserRoleSchema.optional(),
    blocked: zod_1.z.boolean().optional(),
    confirmed: zod_1.z.boolean().optional(),
});
exports.staffUsersResponseSchema = zod_1.z.strictObject({
    data: zod_1.z.array(exports.staffUserRowSchema).max(exports.PAGE_SIZE_MAX),
    meta: zod_1.z.strictObject({ pagination: exports.staffPaginationSchema }),
});
exports.legacyStaffUsersResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.legacyStaffUserRowSchema).max(exports.PAGE_SIZE_MAX),
    meta: zod_1.z.object({ pagination: exports.staffPaginationSchema }),
});
exports.StaffUsersOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-015',
    method: 'GET',
    path: '/api/ops/users',
    request: exports.staffUsersQuerySchema,
    response: exports.staffUsersResponseSchema,
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
exports.STAFF_ROW_KINDS = ['user', 'invitation'];
exports.staffRowKindSchema = zod_1.z.enum(exports.STAFF_ROW_KINDS);
function staffRowId(identity) {
    return `${identity.kind}:${identity.documentId}`;
}
function parseStaffRowId(value) {
    const separator = value.indexOf(':');
    if (separator <= 0)
        return null;
    const kind = exports.staffRowKindSchema.safeParse(value.slice(0, separator));
    const documentId = core_1.documentIdSchema.safeParse(value.slice(separator + 1));
    if (!kind.success || !documentId.success)
        return null;
    return { kind: kind.data, documentId: documentId.data };
}
/**
 * The single pictured name input, rebuilt losslessly from the stored parts.
 * Returns null rather than an empty string when the account has neither name,
 * so the caller renders its own no-value fallback instead of a blank cell.
 */
function staffDisplayName(parts) {
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
function splitStaffDisplayName(displayName) {
    return { first_name: displayName.trim().slice(0, DISPLAY_NAME_MAX), last_name: '' };
}
