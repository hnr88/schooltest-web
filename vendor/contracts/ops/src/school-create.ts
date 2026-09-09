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
import { z } from 'zod';
import {
  accountStatusSchema,
  dataEnvelope,
  documentIdSchema,
  errorEnvelopeSchema,
  onboardingStatusSchema,
  type OpsOperation,
} from './core';

const SCHOOL_NAME_CREATE_MIN = 3;
const SCHOOL_NAME_MAX = 255;
const SUBURB_MAX = 100;
const POSTCODE_MAX = 10;
const PHONE_MAX = 40;
const CONTACT_NAME_MAX = 200;
const CONTACT_PART_MAX = 100;
const EMAIL_MAX = 255;
const TEACHER_COUNT_MAX = 2147483647;

export const australianStateSchema = z.enum([
  'VIC',
  'NSW',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'ACT',
  'NT',
]);
export type AustralianState = z.infer<typeof australianStateSchema>;

export const sectorSchema = z.enum(['government', 'non-government', 'catholic']);
export type Sector = z.infer<typeof sectorSchema>;

export const schoolTypeSchema = z.enum(['combined', 'primary', 'secondary']);
export type SchoolType = z.infer<typeof schoolTypeSchema>;

export const portalPlanSchema = z.enum(['pilot', 'standard', 'enterprise']);
export type PortalPlan = z.infer<typeof portalPlanSchema>;

/** Full lifecycle as reported in results; creates may only request the subset below. */
export const portalStatusSchema = z.enum([
  'active',
  'trial',
  'pending_setup',
  'suspended',
  'archived',
]);
export type PortalStatus = z.infer<typeof portalStatusSchema>;

export const schoolPlanSchema = z.enum(['trial', 'full_license']);
export type SchoolPlan = z.infer<typeof schoolPlanSchema>;

export const billingStatusSchema = z.enum(['not_started', 'active', 'stopped']);
export type BillingStatus = z.infer<typeof billingStatusSchema>;

const timestampSchema = z.iso.datetime();

/**
 * Versioned request body. Strict: a caller smuggling `account_status`,
 * legacy `plan`/`status` or an unknown key through the versioned route
 * fails here with 400 instead of being silently honoured.
 */
export const schoolCreateSchema = z.strictObject({
  name: z.string().trim().min(SCHOOL_NAME_CREATE_MIN).max(SCHOOL_NAME_MAX),
  suburb: z.string().trim().min(1).max(SUBURB_MAX),
  state: australianStateSchema.nullish(),
  sector: sectorSchema.nullish(),
  postcode: z.string().max(POSTCODE_MAX).nullish(),
  schoolType: schoolTypeSchema.nullish(),
  contact_email: z.string().trim().max(EMAIL_MAX).pipe(z.email()),
  contact_first_name: z.string().max(CONTACT_PART_MAX).nullish(),
  contact_last_name: z.string().max(CONTACT_PART_MAX).nullish(),
  phone: z.string().max(PHONE_MAX).nullish(),
  portal: z.strictObject({
    plan: portalPlanSchema,
    status: z.enum(['pending_setup', 'trial', 'active']),
    send_owner_invitation: z.boolean(),
  }),
  contact_name: z.string().trim().min(1).max(CONTACT_NAME_MAX),
});
export type SchoolCreate = z.infer<typeof schoolCreateSchema>;

/**
 * What actually happened with the owner invitation, so the dialog can
 * distinguish school creation from the later invitation request. `failed`
 * after a committed create is a recoverable partial outcome, never a
 * "invitation sent" toast.
 */
export const onboardingDeliverySchema = z.strictObject({
  state: z.enum(['not_requested', 'sent', 'failed']),
  invitation_documentId: documentIdSchema.nullable(),
  error: errorEnvelopeSchema.nullable(),
});
export type OnboardingDelivery = z.infer<typeof onboardingDeliverySchema>;

export const schoolWriteResultSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().min(1).max(SCHOOL_NAME_MAX),
  suburb: z.string().max(SUBURB_MAX).nullable(),
  state: australianStateSchema.nullable(),
  sector: sectorSchema.nullable(),
  postcode: z.string().max(POSTCODE_MAX).nullable(),
  schoolType: schoolTypeSchema.nullable(),
  contact_email: z.string().max(EMAIL_MAX).pipe(z.email()).nullable(),
  contact_first_name: z.string().max(CONTACT_PART_MAX).nullable(),
  contact_last_name: z.string().max(CONTACT_PART_MAX).nullable(),
  phone: z.string().max(PHONE_MAX).nullable(),
  account_status: accountStatusSchema,
  onboarding_status: onboardingStatusSchema,
  plan: schoolPlanSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  portal_plan: portalPlanSchema,
  portal_status: portalStatusSchema,
  trial_ends_at: timestampSchema.nullable(),
  retention_until: timestampSchema.nullable(),
  billing_status: billingStatusSchema,
  contact_name: z.string().max(CONTACT_NAME_MAX).nullable(),
  onboarding_delivery: onboardingDeliverySchema,
  portal_teacher_count: z.number().int().min(0).max(TEACHER_COUNT_MAX),
  suspended_at: timestampSchema.nullable(),
});
export type SchoolWriteResult = z.infer<typeof schoolWriteResultSchema>;

const schoolCreateResponseSchema = dataEnvelope(schoolWriteResultSchema);

/** C-OPS-PORTAL-003 — POST /api/schools */
export const SchoolCreateOperation = Object.freeze({
  contractId: 'C-OPS-PORTAL-003',
  method: 'POST',
  path: '/api/schools',
  request: schoolCreateSchema,
  response: schoolCreateResponseSchema,
  success: 201,
  errors: [400, 401, 403, 404, 409, 429, 500],
} satisfies OpsOperation<typeof schoolCreateSchema, typeof schoolCreateResponseSchema>);
