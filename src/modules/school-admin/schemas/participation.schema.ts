import { z } from 'zod';

// C-RPT-04 (task 78): per-class Test A / Test B completion buckets. The three
// buckets sum to roster_count - enforced server-side, trusted at the boundary.
export const participationBucketsSchema = z.object({
  submitted: z.number().int().nonnegative(),
  in_progress: z.number().int().nonnegative(),
  not_started: z.number().int().nonnegative(),
});

export const participationClassRowSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().nullable(),
  teacher: z.string().nullable(),
  roster_count: z.number().int().nonnegative(),
  test_a: participationBucketsSchema,
  test_b: participationBucketsSchema,
});

export const schoolParticipationSchema = z.object({
  classes: z.array(participationClassRowSchema),
});
