import { z } from 'zod';

// C-CLS-05 / C-CLS-06 response schemas (.qa/CONTRACTS.md). The ONE parse path
// for both new reads: the query functions parse the server envelope here and
// hand typed data inward, so a server shape change fails loudly at the boundary
// instead of drifting through the components.
//
// Every object is STRICT on purpose. A permissive object would silently strip a
// field the server started sending, which is the drift these schemas exist to
// catch — an unexpected key is a contract change and must fail here.

// The product-wide display order: Everyday (vocab_a2) and Classroom (vocab_b1)
// Vocabulary are two tiles, never one blended figure (BUG-008).
export const SUBSKILL_KEYS = [
  'decoding',
  'vocab_a2',
  'grammar',
  'vocab_b1',
  'gist',
  'detail',
  'inference',
  'critical',
] as const;

export const ACARA_PHASES = ['Beginning', 'Emerging', 'Developing', 'Consolidating'] as const;

export const subskillVerdictSchema = z.enum(['mastered', 'not_yet']);

// A null tile is one the sitting holds no evidence for (a strand never
// reached, no gate) — the UI renders the em dash, never "Not yet".
const tileSchema = subskillVerdictSchema.nullable();

export const subskillsSchema = z.strictObject({
  decoding: tileSchema,
  vocab_a2: tileSchema,
  grammar: tileSchema,
  vocab_b1: tileSchema,
  gist: tileSchema,
  detail: tileSchema,
  inference: tileSchema,
  critical: tileSchema,
});

/**
 * Defined ONCE and reused by both endpoint schemas, so the class table and the
 * drill-down can never disagree about a test's shape. Score, phase and
 * subskills are null on anything the backend has no evidence for — the UI
 * renders the em dash there, it never substitutes a zero or a phase.
 */
export const studentTestResultSchema = z.strictObject({
  test_id: z.enum(['A', 'B']),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  overall_score: z.number().int().min(0).max(100).nullable(),
  acara_phase: z.enum(ACARA_PHASES).nullable(),
  subskills: subskillsSchema.nullable(),
  // C-CLS-06 (task 09): the sitting's instants from the shared server
  // projection (class/lib/class-detail-build.ts#buildStudentTests).
  // `completed_at` is null on anything not ended; the history panel derives
  // the duration client-side and renders nothing for a null half.
  started_at: z.iso.datetime().nullable(),
  completed_at: z.iso.datetime().nullable(),
});

export const classDetailTeacherSchema = z.strictObject({
  documentId: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

export const classDetailStudentSchema = z.strictObject({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  tests: z.array(studentTestResultSchema),
});

export const classDetailSummarySchema = z.strictObject({
  students: z.number().int(),
  test_a_completed: z.number().int(),
  test_b_completed: z.number().int(),
  avg_reading_score: z.number().int().nullable(),
});

export const classDetailSchema = z.strictObject({
  documentId: z.string(),
  name: z.string().nullable(),
  year_band: z.string().nullable(),
  teacher: classDetailTeacherSchema.nullable(),
  student_count: z.number().int(),
  summary: classDetailSummarySchema,
  students: z.array(classDetailStudentSchema),
});

export const classStudentDetailSchema = z.strictObject({
  documentId: z.string(),
  given_name: z.string().nullable(),
  family_name: z.string().nullable(),
  first_language: z.string().nullable(),
  // The STUDENT's own proficiency level (the lower-case enum on the student
  // record), not a result phase — a different vocabulary from `acara_phase`
  // inside `tests`.
  acara_phase: z.enum(['beginning', 'emerging', 'developing', 'consolidating']).nullable(),
  class: z.strictObject({ documentId: z.string(), name: z.string().nullable() }),
  tests: z.array(studentTestResultSchema),
});
