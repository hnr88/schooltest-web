import { z } from 'zod';

import type { OnboardSchemaTranslator } from '@/modules/ops/types/schemas.types';

/** The Onboard School modal — the spec's three required fields. */
export function createOnboardSchoolSchema(t: OnboardSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    contact_email: z
      .string()
      .trim()
      .min(1, t('required'))
      .max(255, t('emailTooLong'))
      .pipe(z.email(t('emailInvalid'))),
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
  // Mirrors the server's constraint exactly: 256 bits of crypto-random hex.
  token: z.string().regex(/^[0-9a-f]{64}$/),
  url: z.string(),
  expires_at: z.null(),
  contact: onboardingContactSchema,
});

export const adminInvitationResultSchema = z.strictObject({
  documentId: z.string(),
  email: z.email(),
  status: z.literal('invited'),
  expires_at: z.string(),
  invite_url: z.string(),
});

/** C-SCH-06 200. */
export const revokeInvitationResultSchema = z.strictObject({
  documentId: z.string(),
  revoked_links: z.number().int().min(0),
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
