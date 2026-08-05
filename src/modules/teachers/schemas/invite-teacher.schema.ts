import { z } from 'zod';

import type { InviteSchemaTranslator } from '@/modules/teachers/types/schemas.types';

// Invite form schema (client mirror of the C-INV-01 validation). Spec section 3
// "Add teacher" lists exactly three fields, so the FORM carries exactly those
// three. The invitation role C-INV-01 also requires is not a form value — the
// dialog supplies it (see InviteTeacherDialog).
export function createInviteTeacherSchema(t: InviteSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
  });
}

export type InviteTeacherValues = z.infer<ReturnType<typeof createInviteTeacherSchema>>;
