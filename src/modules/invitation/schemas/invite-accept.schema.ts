import { z } from 'zod';

import { INVITE_PASSWORD_MIN_LENGTH } from '@/modules/invitation/constants/invitation.constants';

// Baked-message factory (same convention as the school-onboarding schemas):
// messages resolve up-front from the `Invite.validation` namespace.
type InviteSchemaTranslator = (key: string) => string;

// --- Server response schemas (C-INV-05/06 data payloads) ---

export const invitationDetailsSchema = z.object({
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['teacher', 'school_admin']),
  school_name: z.string(),
  expires_at: z.string(),
});

export const acceptInvitationResponseSchema = z.object({
  jwt: z.string().min(1),
  user: z.object({
    documentId: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.string(),
  }),
});

// --- Accept form schema (client mirror of the C-INV-06 validation) ---

export function createInviteAcceptSchema(t: InviteSchemaTranslator) {
  return z
    .object({
      first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
      last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
      password: z
        .string()
        .min(INVITE_PASSWORD_MIN_LENGTH, t('passwordTooShort'))
        .max(100, t('tooLong')),
      confirm_password: z.string(),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: t('passwordMismatch'),
      path: ['confirm_password'],
    });
}

export type InviteAcceptValues = z.infer<ReturnType<typeof createInviteAcceptSchema>>;
