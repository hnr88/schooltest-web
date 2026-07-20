import type { z } from 'zod';

import type { studentDetailSchema } from '@/modules/children/schemas/student-detail.schema';

// C-STUDENT-LIST-EXT detail row consumed by the edit wizard prefill. No
// `passport_number` key (API-private, never returned).
export type StudentDetail = z.infer<typeof studentDetailSchema>;

// Pill styling metadata for a student status (C-UI-MYCHILDREN §6 uppercase pill).
export interface StatusMeta {
  labelKey: string;
  className: string;
}
