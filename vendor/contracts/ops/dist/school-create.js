"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolCreateOperation = exports.schoolWriteResultSchema = exports.onboardingDeliverySchema = exports.schoolCreateSchema = exports.billingStatusSchema = exports.schoolPlanSchema = exports.portalStatusSchema = exports.portalPlanSchema = exports.schoolTypeSchema = exports.sectorSchema = exports.australianStateSchema = void 0;
/**
 * OPS-013 — C-OPS-PORTAL-003 POST /api/schools (versioned create).
 *
 * Runtime shapes quoted from mvp/tasks/ops/wave-02/OPS-013-school-create.md.
 * The legacy unversioned baseline (bare body, forced active/not_started/trial)
 * is NOT this schema — it stays in the server, untouched.
 *
 * This module reads ./index's earlier exports, so src/index.ts must re-export
 * it AFTER those definitions (the rest-boundary CJS-cycle pattern).
 */
const zod_1 = require("zod");
const core_1 = require("./core");
const SCHOOL_NAME_CREATE_MIN = 3;
const SCHOOL_NAME_MAX = 255;
const SUBURB_MAX = 100;
const POSTCODE_MAX = 10;
const PHONE_MAX = 40;
const CONTACT_NAME_MAX = 200;
const CONTACT_PART_MAX = 100;
const EMAIL_MAX = 255;
const TEACHER_COUNT_MAX = 2147483647;
exports.australianStateSchema = zod_1.z.enum([
    'VIC',
    'NSW',
    'QLD',
    'SA',
    'WA',
    'TAS',
    'ACT',
    'NT',
]);
exports.sectorSchema = zod_1.z.enum(['government', 'non-government', 'catholic']);
exports.schoolTypeSchema = zod_1.z.enum(['combined', 'primary', 'secondary']);
exports.portalPlanSchema = zod_1.z.enum(['pilot', 'standard', 'enterprise']);
/** Full lifecycle as reported in results; creates may only request the subset below. */
exports.portalStatusSchema = zod_1.z.enum([
    'active',
    'trial',
    'pending_setup',
    'suspended',
    'archived',
]);
exports.schoolPlanSchema = zod_1.z.enum(['trial', 'full_license']);
exports.billingStatusSchema = zod_1.z.enum(['not_started', 'active', 'stopped']);
const timestampSchema = zod_1.z.iso.datetime();
/**
 * Versioned request body. Strict: a caller smuggling `account_status`,
 * legacy `plan`/`status` or an unknown key through the versioned route
 * fails here with 400 instead of being silently honoured.
 */
exports.schoolCreateSchema = zod_1.z.strictObject({
    name: zod_1.z.string().trim().min(SCHOOL_NAME_CREATE_MIN).max(SCHOOL_NAME_MAX),
    suburb: zod_1.z.string().trim().min(1).max(SUBURB_MAX),
    state: exports.australianStateSchema.nullish(),
    sector: exports.sectorSchema.nullish(),
    postcode: zod_1.z.string().max(POSTCODE_MAX).nullish(),
    schoolType: exports.schoolTypeSchema.nullish(),
    contact_email: zod_1.z.string().trim().max(EMAIL_MAX).pipe(zod_1.z.email()),
    contact_first_name: zod_1.z.string().max(CONTACT_PART_MAX).nullish(),
    contact_last_name: zod_1.z.string().max(CONTACT_PART_MAX).nullish(),
    phone: zod_1.z.string().max(PHONE_MAX).nullish(),
    portal: zod_1.z.strictObject({
        plan: exports.portalPlanSchema,
        status: zod_1.z.enum(['pending_setup', 'trial', 'active']),
        send_owner_invitation: zod_1.z.boolean(),
    }),
    contact_name: zod_1.z.string().trim().min(1).max(CONTACT_NAME_MAX),
});
/**
 * What actually happened with the owner invitation, so the dialog can
 * distinguish school creation from the later invitation request. `failed`
 * after a committed create is a recoverable partial outcome, never a
 * "invitation sent" toast.
 */
exports.onboardingDeliverySchema = zod_1.z.strictObject({
    state: zod_1.z.enum(['not_requested', 'sent', 'failed']),
    invitation_documentId: core_1.documentIdSchema.nullable(),
    error: core_1.errorEnvelopeSchema.nullable(),
});
exports.schoolWriteResultSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    name: zod_1.z.string().min(1).max(SCHOOL_NAME_MAX),
    suburb: zod_1.z.string().max(SUBURB_MAX).nullable(),
    state: exports.australianStateSchema.nullable(),
    sector: exports.sectorSchema.nullable(),
    postcode: zod_1.z.string().max(POSTCODE_MAX).nullable(),
    schoolType: exports.schoolTypeSchema.nullable(),
    contact_email: zod_1.z.string().max(EMAIL_MAX).pipe(zod_1.z.email()).nullable(),
    contact_first_name: zod_1.z.string().max(CONTACT_PART_MAX).nullable(),
    contact_last_name: zod_1.z.string().max(CONTACT_PART_MAX).nullable(),
    phone: zod_1.z.string().max(PHONE_MAX).nullable(),
    account_status: core_1.accountStatusSchema,
    onboarding_status: core_1.onboardingStatusSchema,
    plan: exports.schoolPlanSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    portal_plan: exports.portalPlanSchema,
    portal_status: exports.portalStatusSchema,
    trial_ends_at: timestampSchema.nullable(),
    retention_until: timestampSchema.nullable(),
    billing_status: exports.billingStatusSchema,
    contact_name: zod_1.z.string().max(CONTACT_NAME_MAX).nullable(),
    onboarding_delivery: exports.onboardingDeliverySchema,
    portal_teacher_count: zod_1.z.number().int().min(0).max(TEACHER_COUNT_MAX),
    suspended_at: timestampSchema.nullable(),
});
const schoolCreateResponseSchema = (0, core_1.dataEnvelope)(exports.schoolWriteResultSchema);
/** C-OPS-PORTAL-003 — POST /api/schools */
exports.SchoolCreateOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-003',
    method: 'POST',
    path: '/api/schools',
    request: exports.schoolCreateSchema,
    response: schoolCreateResponseSchema,
    success: 201,
    errors: [400, 401, 403, 404, 409, 429, 500],
});
