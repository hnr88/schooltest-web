import { z } from 'zod';

// C-SCH-04 (v2) / C-SCH-05 / C-SCH-06 / C-SCH-07 (mission st-ops-onboarding).
// Client mirror of the server's shared contract
// (schooltest-api/src/contracts/school-onboarding-invitation.ts). Every object
// is STRICT, so a server that starts returning an extra field — a numeric id, a
// token, a timestamp — fails the parse here instead of leaking into the UI.

// Baked-message factory (the createInviteTeacherSchema convention): messages
// resolve up-front from the `Ops.onboard.validation` namespace.
type OnboardSchemaTranslator = (key: string) => string;

/** The Onboard School modal — the spec's three required fields. */
export function createOnboardSchoolSchema(t: OnboardSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    contact_email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
  });
}

export type OnboardSchoolValues = z.infer<ReturnType<typeof createOnboardSchoolSchema>>;

const onboardingContactSchema = z.strictObject({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
});

/**
 * C-SCH-04 (v2) 201 and C-SCH-05 200. `expires_at` is typed `null`, not
 * `string | null`: the MVP magic link never expires, so a reintroduced expiry
 * must fail loudly rather than pass unnoticed.
 */
export const onboardingLinkResultSchema = z.strictObject({
  token: z.string(),
  url: z.string(),
  expires_at: z.null(),
  contact: onboardingContactSchema,
});

/** C-SCH-06 200. */
export const revokeInvitationResultSchema = z.strictObject({
  documentId: z.string(),
  revoked_links: z.number().int(),
  account_status: z.literal('prospect'),
  onboarding_status: z.literal('not_started'),
});

/** C-SCH-07 200 — exactly six keys. */
export const schoolInvitationSchema = z.strictObject({
  documentId: z.string(),
  account_status: z.string().nullable(),
  onboarding_status: z.string().nullable(),
  contact_first_name: z.string().nullable(),
  contact_last_name: z.string().nullable(),
  contact_email: z.string().nullable(),
});
