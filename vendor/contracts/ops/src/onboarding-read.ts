/**
 * C-OPS-PORTAL-011 — GET /api/schools/{documentId}/onboarding-invitation
 * (OPS-021). The ops school-detail read of the stored primary contact and the
 * two lifecycle columns the invitation controls are gated on.
 *
 * NOTHING here is retyped: the six-key projection, the two status enums and the
 * documentId primitive all come from `./index`, which already holds the C-SCH-07
 * definition moved out of schooltest-api/src/contracts. This module only
 * NARROWS and NAMES what that definition already promises, so the API, the web
 * client and both e2e suites can assert one shape instead of three.
 *
 * Two properties this file exists to guarantee:
 *  - `account_status` and `onboarding_status` are INDEPENDENT. An `active`
 *    account does not imply a finished onboarding, and `onboarding_status:
 *    "complete"` says the school finished the onboarding wizard — it says
 *    nothing about whether a staff invitation was ever accepted.
 *  - the read carries NO link material. The magic-link token and URL are
 *    returned only by the send/resend operations (C-OPS-PORTAL-012); a read that
 *    ever echoed them would put a live credential in every school-detail page
 *    load, so `containsLinkMaterial` is the assertion that keeps that true.
 *
 * Primitives come from './core', never from './index': importing the barrel back
 * from an operation module is what formed the CommonJS cycle that crashed
 * Strapi's synchronous config load (see index.ts).
 */
import { z } from 'zod';

import {
  accountStatusSchema,
  dataEnvelope,
  documentIdSchema,
  onboardingStatusSchema,
  schoolInvitationStateSchema,
} from './core';

const CONTACT_NAME_MAX = 100;
const CONTACT_EMAIL_MAX = 255;

/** The exact six keys C-SCH-07 promises — nothing else may reach the wire. */
export const ONBOARDING_READ_KEYS = [
  'account_status',
  'contact_email',
  'contact_first_name',
  'contact_last_name',
  'documentId',
  'onboarding_status',
] as const;

/** One definition of the path, so client, server assertions and tests agree. */
export function onboardingReadPath(documentId: string): string {
  return `/api/schools/${documentId}/onboarding-invitation`;
}

/**
 * The versioned projection. Same six keys as the observed baseline, with the two
 * lifecycle columns narrowed from `string | null` to their real enums: a value
 * outside the enum is a server defect, and a client that renders a status badge
 * must fail loudly on it rather than paint an unlabelled chip.
 *
 * `null` is retained on every field on purpose. A school created before the
 * onboarding flow existed has no stored contact at all, and the read must be
 * able to say so instead of inventing an empty string.
 */
export const onboardingStateSchema = z.strictObject({
  documentId: documentIdSchema,
  account_status: accountStatusSchema.nullable(),
  onboarding_status: onboardingStatusSchema.nullable(),
  contact_first_name: z.string().max(CONTACT_NAME_MAX).nullable(),
  contact_last_name: z.string().max(CONTACT_NAME_MAX).nullable(),
  contact_email: z.string().max(CONTACT_EMAIL_MAX).nullable(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

/** `{ data: OnboardingState }` — the 200 body of C-OPS-PORTAL-011. */
export const onboardingReadResponseSchema = dataEnvelope(onboardingStateSchema);

/**
 * D-COMPAT: the versioned projection is strictly NARROWER than the observed
 * baseline, so every body a versioned caller accepts is still a valid legacy
 * body. An unversioned caller keeps the exact shape it has today; this predicate
 * is what a compatibility test asserts that with, rather than restating the six
 * keys by hand on both sides of the comparison.
 */
export function isLegacyOnboardingState(body: unknown): boolean {
  return schoolInvitationStateSchema.safeParse(body).success;
}

/** A 64-hex magic-link token, exactly as C-OPS-PORTAL-012 mints it. */
const LINK_TOKEN = /[0-9a-f]{64}/i;

/** Any onboarding/invite acceptance URL, however it is spelled. */
const LINK_URL = /https?:\/\/[^"\s]*\/(onboarding|invite|school-onboarding)\//i;

/**
 * True when a payload carries magic-link material. The read contract forbids it,
 * so this is asserted against the RAW response body — a nested or renamed key
 * would slip past a key-name check, and the token's shape would not.
 */
export function containsLinkMaterial(body: unknown): boolean {
  let serialised: string;
  try {
    serialised = JSON.stringify(body ?? null) ?? '';
  } catch {
    // A body that cannot be serialised cannot be proven clean; treat it as dirty
    // rather than passing it silently.
    return true;
  }
  return LINK_TOKEN.test(serialised) || LINK_URL.test(serialised);
}
