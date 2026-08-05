import { z } from 'zod';

import type { InviteSchemaTranslator } from '@/modules/teachers/types/schemas.types';

// C-TCH-04 edit form schema — the client mirror of the PATCH body whitelist:
// first_name / last_name / email only, all required, email format checked.
export function createEditTeacherSchema(t: InviteSchemaTranslator) {
  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    email: z.string().trim().min(1, t('required')).pipe(z.email(t('emailInvalid'))),
  });
}

export type EditTeacherValues = z.infer<ReturnType<typeof createEditTeacherSchema>>;
