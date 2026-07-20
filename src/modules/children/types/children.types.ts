import type { z } from 'zod';

import type {
  childProgressDataSchema,
  childProgressMetricsSchema,
  childProgressResultSchema,
  childProgressStudentSchema,
} from '@/modules/children/schemas/child-progress.schema';
import type { studentDetailSchema } from '@/modules/children/schemas/student-detail.schema';

// C-STUDENT-LIST-EXT detail row consumed by the edit wizard prefill. No
// `passport_number` key (API-private, never returned).
export type StudentDetail = z.infer<typeof studentDetailSchema>;

export type ChildProgress = z.infer<typeof childProgressDataSchema>;
export type ChildProgressStudent = z.infer<typeof childProgressStudentSchema>;
export type ChildProgressMetrics = z.infer<typeof childProgressMetricsSchema>;
export type ChildProgressResult = z.infer<typeof childProgressResultSchema>;

export type ResultBadgeVariant = 'accent' | 'success' | 'warning';

// Pill styling metadata for a student status (C-UI-MYCHILDREN §6 uppercase pill).
export interface StatusMeta {
  labelKey: string;
  className: string;
}
