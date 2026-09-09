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
import { z } from 'zod';

import {
  accountStatusSchema,
  dataEnvelope,
  onboardingStatusSchema,
  type OpsOperation,
} from './core';
import {
  australianStateSchema,
  billingStatusSchema,
  onboardingDeliverySchema,
  portalPlanSchema,
  portalStatusSchema,
  schoolPlanSchema,
  schoolTypeSchema,
  sectorSchema,
  schoolWriteResultSchema,
} from './school-create';
import {
  SCHOOL_SUSPEND_CODES,
  formatResourceVersion,
  parseResourceVersion,
  resourceVersionMatches,
} from './school-suspend';

export { SCHOOL_SUSPEND_CODES, formatResourceVersion, parseResourceVersion, resourceVersionMatches };

const SUBURB_MAX = 100;
const POSTCODE_MAX = 10;
const CONTACT_PART_MAX = 100;
const CONTACT_NAME_MAX = 200;
const EMAIL_MAX = 255;
const PHONE_MAX = 40;

export const PATCH_REJECTED_LIFECYCLE_KEYS = ['account_status', 'onboarding_status', 'portal_status'] as const;
export type PatchRejectedLifecycleKey = (typeof PATCH_REJECTED_LIFECYCLE_KEYS)[number];

export const SCHOOL_PATCH_IF_MATCH_REQUIRED = SCHOOL_SUSPEND_CODES.versionRequired;
export const SCHOOL_PATCH_IF_MATCH_STALE = SCHOOL_SUSPEND_CODES.versionStale;

/** The partial profile body. Omitted = unchanged; null clears a nullable field. */
export const schoolPatchSchema = z
  .strictObject({
    // `name` and `plan` may be ABSENT (omitted = unchanged) but can never be
    // null — `.optional()`, not `.nullish()`.
    name: z.string().trim().min(1).max(255).optional(),
    suburb: z.string().trim().max(SUBURB_MAX).nullish(),
    state: australianStateSchema.nullish(),
    sector: sectorSchema.nullish(),
    postcode: z.string().max(POSTCODE_MAX).nullish(),
    schoolType: z.enum(['combined', 'primary', 'secondary']).nullish(),
    contact_email: z.string().trim().max(EMAIL_MAX).pipe(z.email()).nullish(),
    contact_first_name: z.string().max(CONTACT_PART_MAX).nullish(),
    contact_last_name: z.string().max(CONTACT_PART_MAX).nullish(),
    phone: z.string().max(40).nullish(),
    plan: schoolPlanSchema.optional(),
    portal_plan: portalPlanSchema.nullish(),
    contact_name: z.string().trim().max(CONTACT_NAME_MAX).nullish(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'an empty patch is not a valid edit' });
export type SchoolPatch = z.infer<typeof schoolPatchSchema>;

/** A lifecycle key arriving through the form patch is an explicit 409-boundary rejection. */
export function patchLifecycleKeys(input: Record<string, unknown>): PatchRejectedLifecycleKey[] {
  return PATCH_REJECTED_LIFECYCLE_KEYS.filter((key) => key in input);
}

/** The response body: the SAME shape the create returns, with a pure edit's
 * delivery state pinned to 'not_requested' (the delivery OBJECT keeps its
 * full shape — the web renders the failed-delivery partial from it). */
export const schoolPatchResultSchema = schoolWriteResultSchema.extend({
  onboarding_delivery: onboardingDeliverySchema.extend({
    state: z.literal('not_requested'),
  }),
});
export type SchoolPatchResult = z.infer<typeof schoolPatchResultSchema>;

export const schoolPatchResponseSchema = dataEnvelope(schoolPatchResultSchema);
export type SchoolPatchResponse = z.infer<typeof schoolPatchResponseSchema>;

/** Single place that builds the URL, so no call site hand-concatenates it. */
export function schoolPatchPath(schoolDocumentId: string): string {
  return `/api/schools/${encodeURIComponent(schoolDocumentId)}`;
}

/** C-OPS-PORTAL-004 — PATCH /api/schools/{documentId} (versioned, If-Match). */
export const SchoolPatchOperation: OpsOperation<
  typeof schoolPatchSchema,
  typeof schoolPatchResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-004',
  method: 'PATCH',
  path: '/api/schools/{documentId}',
  request: schoolPatchSchema,
  response: schoolPatchResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 409, 412, 429, 500],
});
