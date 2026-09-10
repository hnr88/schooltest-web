"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffInviteOperation = exports.staffInviteResponseSchema = exports.staffInviteBodySchema = exports.StaffInvitationsOperation = exports.staffInvitationsQuerySchema = exports.legacyStaffInvitationsResponseSchema = exports.staffInvitationsResponseSchema = exports.staffInvitationsPaginationSchema = exports.legacyStaffInvitationRowSchema = exports.staffInvitationRowSchema = exports.staffInvitationSchoolRefSchema = exports.staffInvitationStatusSchema = exports.staffInvitationRoleSchema = void 0;
exports.resolveStaffInvitationStatus = resolveStaffInvitationStatus;
exports.staffInvitationDisplayName = staffInvitationDisplayName;
exports.staffInvitationInvitedDaysAgo = staffInvitationInvitedDaysAgo;
exports.staffInvitationHasUserAccount = staffInvitationHasUserAccount;
/**
 * OPS-026 — C-OPS-PORTAL-016 `GET /api/ops/invitations`.
 *
 * ONE definition of the staff-invitation read, imported by the Strapi
 * projection tests and by the web query hook, so the pending-invitation row can
 * not drift between the two sides.
 *
 * Three properties this module exists to pin:
 *  - A list row NEVER carries `token`. The strict object rejects it on the way
 *    out, so a projection that leaks the invitation secret fails the parse
 *    instead of shipping a working invite link into a directory response.
 *  - `invited_at` is the invitation's real creation instant. `expires_at` is a
 *    DIFFERENT fact (creation + TTL) and must never stand in for it — the
 *    pictured "Invited N days ago" subtitle would then be off by the whole TTL.
 *  - `status` is evaluated against server time: a row still stored `invited`
 *    whose `expires_at` has passed reads `expired`. Storage is not rewritten by
 *    a read; the derivation lives here so filter and projection agree.
 *
 * The unversioned baseline (no X-Ops-Portal-Version header) keeps exactly the
 * nine keys it serves today — `legacyStaffInvitationRowSchema` is that shape,
 * derived from this one rather than restated, so the two cannot drift either.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const EMAIL_MAX = 255;
const NAME_MAX = 100;
const SCHOOL_NAME_MAX = 255;
const DISPLAY_NAME_MAX = 200;
const QUERY_MAX = 120;
const PAGE_MAX = 100000;
const PAGE_SIZE_MAX = 200;
const COUNT_MAX = 2147483647;
const MS_PER_DAY = 86400000;
exports.staffInvitationRoleSchema = zod_1.z.enum(['teacher', 'school_admin']);
exports.staffInvitationStatusSchema = zod_1.z.enum([
    'invited',
    'accepted',
    'expired',
    'revoked',
]);
/** Every timestamp on the wire is an ISO instant; a bare date is not one. */
const timestampSchema = zod_1.z.iso.datetime({ offset: true });
exports.staffInvitationSchoolRefSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().max(SCHOOL_NAME_MAX).nullable(),
});
/**
 * The portal row. `role`/`status` are nullable because the stored enum can be
 * absent on an old row, and an unknown role must surface as null rather than be
 * guessed into `teacher`.
 */
exports.staffInvitationRowSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    email: zod_1.z.string().max(EMAIL_MAX).nullable(),
    first_name: zod_1.z.string().max(NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(NAME_MAX).nullable(),
    role: exports.staffInvitationRoleSchema.nullable(),
    status: exports.staffInvitationStatusSchema.nullable(),
    expires_at: timestampSchema.nullable(),
    accepted_at: timestampSchema.nullable(),
    revoked_at: timestampSchema.nullable(),
    school: exports.staffInvitationSchoolRefSchema.nullable(),
    display_name: zod_1.z.string().max(DISPLAY_NAME_MAX).nullable(),
    invited_at: timestampSchema.nullable(),
});
/** The observed pre-portal shape: the same row WITHOUT the two portal keys. */
exports.legacyStaffInvitationRowSchema = exports.staffInvitationRowSchema.omit({
    display_name: true,
    invited_at: true,
});
exports.staffInvitationsPaginationSchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(PAGE_MAX),
    pageSize: zod_1.z.number().int().min(1).max(PAGE_SIZE_MAX),
    pageCount: zod_1.z.number().int().min(0).max(COUNT_MAX),
    total: zod_1.z.number().int().min(0).max(COUNT_MAX),
});
function listEnvelope(row) {
    return zod_1.z.strictObject({
        data: zod_1.z.array(row).max(PAGE_SIZE_MAX),
        meta: zod_1.z.strictObject({ pagination: exports.staffInvitationsPaginationSchema }),
    });
}
exports.staffInvitationsResponseSchema = listEnvelope(exports.staffInvitationRowSchema);
exports.legacyStaffInvitationsResponseSchema = listEnvelope(exports.legacyStaffInvitationRowSchema);
/**
 * The query string, decoded. HTTP delivers strings; the server decodes once and
 * validates against this, so `pageSize=0`, `role=owner` or `page=1.5` are 400s
 * rather than a silent clamp that hides how much data the operator did not see.
 */
exports.staffInvitationsQuerySchema = zod_1.z.strictObject({
    page: zod_1.z.number().int().min(1).max(PAGE_MAX).optional(),
    pageSize: zod_1.z.number().int().min(1).max(PAGE_SIZE_MAX).optional(),
    q: zod_1.z.string().max(QUERY_MAX).optional(),
    school: core_1.documentIdSchema.optional(),
    role: exports.staffInvitationRoleSchema.optional(),
    status: exports.staffInvitationStatusSchema.optional(),
});
/**
 * Expiry is a fact about the clock, not about the stored row: only a pending
 * `invited` row can become `expired`, and only once `expires_at` is at or
 * behind server time. `accepted` and `revoked` are terminal and never reopen.
 */
function resolveStaffInvitationStatus(stored, expiresAt, nowMs) {
    if (stored !== 'invited' || expiresAt === null)
        return stored;
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry))
        return stored;
    return expiry <= nowMs ? 'expired' : 'invited';
}
/**
 * The single pictured name input, preserved losslessly. An invitation may carry
 * no usable name at all — that is null, never the email address and never a
 * surname guessed out of one half of the pair.
 */
function staffInvitationDisplayName(firstName, lastName) {
    const joined = [firstName ?? '', lastName ?? '']
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join(' ');
    return joined.length > 0 ? joined.slice(0, DISPLAY_NAME_MAX) : null;
}
/**
 * Whole days between the invitation's creation and now, for the "Invited N days
 * ago" subtitle. Null when the row has no creation instant (an old row written
 * before the column existed) so the UI can say "unknown" instead of "0 days".
 * A future timestamp clamps to 0 rather than rendering a negative age.
 */
function staffInvitationInvitedDaysAgo(invitedAt, nowMs) {
    if (invitedAt === null)
        return null;
    const invited = Date.parse(invitedAt);
    if (!Number.isFinite(invited))
        return null;
    return Math.max(0, Math.floor((nowMs - invited) / MS_PER_DAY));
}
/**
 * An ACCEPTED invitation is not a second person: the staff user account created
 * by acceptance is the active identity, and rendering both would double every
 * accepted admin/teacher in the pictured tab. The invitation row stays readable
 * as history; it just never counts as an active person.
 */
function staffInvitationHasUserAccount(status) {
    return status === 'accepted';
}
// The discriminated row identity for a staff tab that unions accounts with
// invitations (`invitation:<documentId>`) is NOT redefined here: it is
// `staffRowId({ kind: 'invitation', documentId })` from ./staff-users, the one
// definition both halves of that union already share.
/** C-OPS-PORTAL-016 — GET /api/ops/invitations */
exports.StaffInvitationsOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-016',
    method: 'GET',
    path: '/api/ops/invitations',
    request: exports.staffInvitationsQuerySchema,
    response: exports.staffInvitationsResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/* ------------------------------------------------------------------ *
 * C-OPS-INV-CREATE — POST /api/ops/schools/{documentId}/{admin|teacher}-invitations.
 *
 * DECLARATION ONLY. Task 25 moves the server and the web hook onto these
 * symbols; today the same shape is maintained twice, in the controller's own
 * parser (`schooltest-api/src/api/school/lib/school-invitation-write.actions.ts`)
 * and in the web dialog, which is the duplication this record retires.
 *
 * READ BEFORE IMPLEMENTING: the two deployed parsers do NOT both match the
 * record this schema encodes. The unversioned parser takes
 * `{ email, first_name, last_name, role }` and rejects `message` as an unknown
 * field; the versioned parser (X-Ops-Portal-Version) takes
 * `{ email, display_name, message?, access_model?, role }` and rejects
 * `first_name`/`last_name`. The record — `{ first_name, last_name, email,
 * message? }`, strict, no `role` — is the frozen signature (RUN.md law 4) and
 * is what this declaration states; reconciling the two live parsers with it is
 * task 25's work, not task 01's, and it is a wire change on at least one of
 * the two paths.
 * ------------------------------------------------------------------ */
/** No length is recorded for `message`; this bound is declared here, not derived. */
const INVITE_MESSAGE_MAX = 1000;
/**
 * The invite body. `role` is NOT a body key: the path segment
 * (`admin-invitations` / `teacher-invitations`) forces it server-side, so a
 * caller cannot promote a teacher invite into an admin one by sending a field.
 * Names and address are trimmed, so a padded value is accepted rather than
 * 400'd — the same rule `onboardingInviteBodySchema` applies in ./core.
 */
exports.staffInviteBodySchema = zod_1.z.strictObject({
    first_name: zod_1.z.string().trim().min(1).max(NAME_MAX),
    last_name: zod_1.z.string().trim().min(1).max(NAME_MAX),
    email: zod_1.z.string().trim().max(EMAIL_MAX).pipe(zod_1.z.email()),
    message: zod_1.z.string().trim().max(INVITE_MESSAGE_MAX).optional(),
});
/** 201 body — the created invitation as the list already projects it. */
exports.staffInviteResponseSchema = (0, core_1.dataEnvelope)(exports.staffInvitationRowSchema);
/**
 * C-OPS-INV-CREATE. 201 on create; 409 when the address already has access to
 * this school, or when the single-admin rule refuses a second one.
 *
 * `path` carries the record's `{admin|teacher}` alternation because ONE
 * operation serves both routes — the role is the segment. `errors` is the
 * record's list verbatim: [400, 401, 403, 404, 409].
 */
exports.StaffInviteOperation = Object.freeze({
    contractId: 'C-OPS-INV-CREATE',
    method: 'POST',
    path: '/api/ops/schools/{documentId}/{admin|teacher}-invitations',
    request: exports.staffInviteBodySchema,
    response: exports.staffInviteResponseSchema,
    success: 201,
    errors: [400, 401, 403, 404, 409],
});
