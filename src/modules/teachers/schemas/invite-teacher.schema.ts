import { z } from 'zod';

// Baked-message factory (same convention as the school-onboarding schemas):
// messages resolve up-front from the `Teachers.validation` namespace.
type InviteSchemaTranslator = (key: string) => string;

// Invite form schema (client mirror of the C-INV-01 validation).
export function createInviteTeacherSchema(t: InviteSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
    role: z.enum(['teacher', 'school_admin'], { error: t('required') }),
  });
}

export type InviteTeacherValues = z.infer<ReturnType<typeof createInviteTeacherSchema>>;
