import { z } from 'zod';

// C-CLS-05 / C-CLS-06 response schemas (.qa/CONTRACTS.md). The ONE parse path
// for both new reads: the query functions parse the server envelope here and
// hand typed data inward, so a server shape change fails loudly at the boundary
// instead of drifting through the components.

export const SUBSKILL_KEYS = [
  'decoding',
  'vocabulary',
  'grammar',
  'gist',
  'detail',
  'inference',
  'critical',
] as const;

export const ACARA_PHASES = ['Beginning', 'Emerging', 'Developing', 'Consolidating'] as const;

export const subskillVerdictSchema = z.enum(['mastered', 'not_yet']);

export const subskillsSchema = z.object({
  decoding: subskillVerdictSchema,
  vocabulary: subskillVerdictSchema,
  grammar: subskillVerdictSchema,
  gist: subskillVerdictSchema,
  detail: subskillVerdictSchema,
  inference: subskillVerdictSchema,
  critical: subskillVerdictSchema,
});

/**
 * Defined ONCE and reused by both endpoint schemas, so the class table and the
 * drill-down can never disagree about a test's shape. Score, phase and
 * subskills are null on anything the backend has no evidence for — the UI
 * renders the em dash there, it never substitutes a zero or a phase.
 */
export const studentTestResultSchema = z.object({
  test_id: z.enum(['A', 'B']),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  overall_score: z.number().int().min(0).max(100).nullable(),
  acara_phase: z.enum(ACARA_PHASES).nullable(),
  subskills: subskillsSchema.nullable(),
});

export const classDetailTeacherSchema = z.object({
  documentId: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

export const classDetailStudentSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  tests: z.array(studentTestResultSchema),
});

export const classDetailSummarySchema = z.object({
  students: z.number().int(),
  test_a_completed: z.number().int(),
  test_b_completed: z.number().int(),
  avg_reading_score: z.number().nullable(),
});

export const classDetailSchema = z.object({
  documentId: z.string(),
  name: z.string().nullable(),
  year_band: z.string().nullable(),
  teacher: classDetailTeacherSchema.nullable(),
  student_count: z.number().int(),
  summary: classDetailSummarySchema,
  students: z.array(classDetailStudentSchema),
});

export const classStudentDetailSchema = z.object({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  first_language: z.string().nullable(),
  acara_phase: z.string().nullable(),
  class: z.object({ documentId: z.string(), name: z.string().nullable() }),
  tests: z.array(studentTestResultSchema),
});
