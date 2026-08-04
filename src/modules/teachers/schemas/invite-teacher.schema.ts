import { z } from 'zod';

import type { InviteSchemaTranslator } from '@/modules/teachers/types/schemas.types';

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
