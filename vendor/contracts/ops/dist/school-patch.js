"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolPatchOperation = exports.schoolPatchResponseSchema = exports.schoolPatchResultSchema = exports.schoolPatchSchema = exports.SCHOOL_PATCH_IF_MATCH_STALE = exports.SCHOOL_PATCH_IF_MATCH_REQUIRED = exports.PATCH_REJECTED_LIFECYCLE_KEYS = exports.resourceVersionMatches = exports.parseResourceVersion = exports.formatResourceVersion = exports.SCHOOL_SUSPEND_CODES = void 0;
exports.patchLifecycleKeys = patchLifecycleKeys;
exports.schoolPatchPath = schoolPatchPath;
/**
 * OPS-014 — C-OPS-PORTAL-004 PATCH /api/schools/{documentId} (backlog task 10,
 * the versioned school EDIT behind the same profile contract as the create).
 *
 * Rules the module pins, from 10-school-form.md and contracts.openapi.json:
 *  - The body is a PARTIAL: omitted means unchanged, null clears a nullable
 *    field, `minProperties: 1` makes an empty patch a 400, and `name` (and the
 *    legacy `plan`) can never be null.
 *  - LIFECYCLE KEYS ARE REJECTED at the boundary: `account_status`,
 *    `onboarding_status` and `portal_status` move through task 12's lifecycle
 *    services (suspend/activate/archive), never through the profile form.
 *  - Versioned edits carry `If-Match` quoting the `updatedAt` the operator's
    * page actually loaded (parseResourceVersion/resourceVersionMatches from the
 *    school-suspend contract — ONE version rule, shared). Stale is 412 with
 *    the draft intact; no client-generated timestamps.
 *  - The response is the SAME SchoolWriteResult the create returns, with
 *    `onboarding_delivery: not_requested` for a pure edit.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const school_create_1 = require("./school-create");
const school_suspend_1 = require("./school-suspend");
Object.defineProperty(exports, "SCHOOL_SUSPEND_CODES", { enumerable: true, get: function () { return school_suspend_1.SCHOOL_SUSPEND_CODES; } });
Object.defineProperty(exports, "formatResourceVersion", { enumerable: true, get: function () { return school_suspend_1.formatResourceVersion; } });
Object.defineProperty(exports, "parseResourceVersion", { enumerable: true, get: function () { return school_suspend_1.parseResourceVersion; } });
Object.defineProperty(exports, "resourceVersionMatches", { enumerable: true, get: function () { return school_suspend_1.resourceVersionMatches; } });
const SUBURB_MAX = 100;
const POSTCODE_MAX = 10;
const CONTACT_PART_MAX = 100;
const CONTACT_NAME_MAX = 200;
const EMAIL_MAX = 255;
const PHONE_MAX = 40;
exports.PATCH_REJECTED_LIFECYCLE_KEYS = ['account_status', 'onboarding_status', 'portal_status'];
exports.SCHOOL_PATCH_IF_MATCH_REQUIRED = school_suspend_1.SCHOOL_SUSPEND_CODES.versionRequired;
exports.SCHOOL_PATCH_IF_MATCH_STALE = school_suspend_1.SCHOOL_SUSPEND_CODES.versionStale;
/** The partial profile body. Omitted = unchanged; null clears a nullable field. */
exports.schoolPatchSchema = zod_1.z
    .strictObject({
    // `name` and `plan` may be ABSENT (omitted = unchanged) but can never be
    // null — `.optional()`, not `.nullish()`.
    name: zod_1.z.string().trim().min(1).max(255).optional(),
    suburb: zod_1.z.string().trim().max(SUBURB_MAX).nullish(),
    state: school_create_1.australianStateSchema.nullish(),
    sector: school_create_1.sectorSchema.nullish(),
    postcode: zod_1.z.string().max(POSTCODE_MAX).nullish(),
    schoolType: zod_1.z.enum(['combined', 'primary', 'secondary']).nullish(),
    contact_email: zod_1.z.string().trim().max(EMAIL_MAX).pipe(zod_1.z.email()).nullish(),
    contact_first_name: zod_1.z.string().max(CONTACT_PART_MAX).nullish(),
    contact_last_name: zod_1.z.string().max(CONTACT_PART_MAX).nullish(),
    phone: zod_1.z.string().max(40).nullish(),
    plan: school_create_1.schoolPlanSchema.optional(),
    portal_plan: school_create_1.portalPlanSchema.nullish(),
    contact_name: zod_1.z.string().trim().max(CONTACT_NAME_MAX).nullish(),
})
    .refine((body) => Object.keys(body).length > 0, { message: 'an empty patch is not a valid edit' });
/** A lifecycle key arriving through the form patch is an explicit 409-boundary rejection. */
function patchLifecycleKeys(input) {
    return exports.PATCH_REJECTED_LIFECYCLE_KEYS.filter((key) => key in input);
}
/** The response body: the SAME shape the create returns, with a pure edit's
 * delivery state pinned to 'not_requested' (the delivery OBJECT keeps its
 * full shape — the web renders the failed-delivery partial from it). */
exports.schoolPatchResultSchema = school_create_1.schoolWriteResultSchema.extend({
    onboarding_delivery: school_create_1.onboardingDeliverySchema.extend({
        state: zod_1.z.literal('not_requested'),
    }),
});
exports.schoolPatchResponseSchema = (0, core_1.dataEnvelope)(exports.schoolPatchResultSchema);
/** Single place that builds the URL, so no call site hand-concatenates it. */
function schoolPatchPath(schoolDocumentId) {
    return `/api/schools/${encodeURIComponent(schoolDocumentId)}`;
}
/** C-OPS-PORTAL-004 — PATCH /api/schools/{documentId} (versioned, If-Match). */
exports.SchoolPatchOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-004',
    method: 'PATCH',
    path: '/api/schools/{documentId}',
    request: exports.schoolPatchSchema,
    response: exports.schoolPatchResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 409, 412, 429, 500],
});
