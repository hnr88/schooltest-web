import type { z } from 'zod';

import type {
  acaraMovementDetailSchema,
  acaraMovementSchema,
  classProgressResponseSchema,
  progressCohortSchema,
  progressMoverSchema,
  progressSubskillShiftSchema,
  progressSummarySchema,
} from '@/modules/teacher/schemas/teacher-progress.schema';

export type ProgressCohort = z.infer<typeof progressCohortSchema>;
export type ProgressSummary = z.infer<typeof progressSummarySchema>;
export type ProgressSubskillShift = z.infer<typeof progressSubskillShiftSchema>;
export type AcaraMovementDetail = z.infer<typeof acaraMovementDetailSchema>;
export type AcaraMovement = z.infer<typeof acaraMovementSchema>;
export type ProgressMover = z.infer<typeof progressMoverSchema>;
export type ClassProgressResponse = z.infer<typeof classProgressResponseSchema>;
