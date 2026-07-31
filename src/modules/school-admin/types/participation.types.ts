import type { z } from 'zod';

import type {
  participationBucketsSchema,
  participationClassRowSchema,
  schoolParticipationSchema,
} from '@/modules/school-admin/schemas/participation.schema';

// C-RPT-04 wire shapes (task 78): completion status only - the payload can
// never carry labels, bands or skill data, so the types have no such fields.
export type ParticipationBuckets = z.infer<typeof participationBucketsSchema>;
export type ParticipationClassRow = z.infer<typeof participationClassRowSchema>;
export type SchoolParticipation = z.infer<typeof schoolParticipationSchema>;
