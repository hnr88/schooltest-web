import { z } from 'zod';

const skillSchema = z.enum(['reading', 'listening', 'speaking', 'writing']);
const cefrBandSchema = z.enum(['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1']);
const readinessSchema = z.enum(['met', 'approaching', 'not_yet', 'not_assessed']);
const resultStatusSchema = z.enum(['scoring', 'partial_pending', 'complete']);

export const childProgressStudentSchema = z.strictObject({
  documentId: z.string().min(1),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  year_level: z.number().int().nullable(),
  nationality: z.string().nullable(),
  current_year_level: z.string().nullable(),
  target_entry_year: z.string().nullable(),
  target_entry_term: z.string().nullable(),
  status: z.enum(['active', 'archived', 'enrolled']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const childProgressMetricsSchema = z.strictObject({
  totalSessions: z.number().int().nonnegative(),
  completedSessions: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative(),
  officialResults: z.number().int().nonnegative(),
});

export const childProgressResultSchema = z.strictObject({
  documentId: z.string().min(1),
  skill: skillSchema.nullable(),
  displayLabel: z.string().nullable(),
  cefrBand: cefrBandSchema.nullable(),
  readiness: readinessSchema.nullable(),
  status: resultStatusSchema,
  publishedAt: z.iso.datetime().nullable(),
});

export const childProgressDataSchema = z.strictObject({
  student: childProgressStudentSchema,
  metrics: childProgressMetricsSchema,
  recentResults: z.array(childProgressResultSchema).max(5),
});

// C-PARENT-CHILD-PROGRESS: parse the Strapi single-response envelope exactly
// at the typed Axios boundary so an off-contract payload never reaches the UI.
export const childProgressResponseSchema = z.strictObject({
  data: childProgressDataSchema,
  meta: z.record(z.string(), z.unknown()),
});
