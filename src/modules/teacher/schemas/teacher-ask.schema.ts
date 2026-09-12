import { z } from 'zod';

/**
 * C-TA-1 `POST /api/teacher/ask` — the web mirror of
 * `schooltest-api/src/contracts/teacher-ask.ts` (chunk B4). Nothing else in this
 * module speaks to an LLM: `grep -rn "teacher/ask" src` finds only this pair and
 * `queries/use-teacher-ask.mutation.ts`.
 *
 * The three rules the API contract pins, mirrored so the drawer cannot drift:
 *  - `refused` is a 200, not an error. A question this class's results cannot
 *    answer comes back with `refused: true` and a sentence saying what the data
 *    does cover; the drawer renders it as a normal AI turn under a title.
 *  - `grounding` travels with the answer, so the partial-cohort line is drawn
 *    from the SAME numbers the answer was built on — never a second read.
 *  - There is no canned-answer arm. A gateway that cannot be reached is the
 *    503 the drawer shows (RULE 0 — real data only).
 */
const documentId = z.string().min(1);
const count = z.number().int().min(0);

/** A question is a sentence, not a document — the composer's own cap. */
export const TEACHER_ASK_QUESTION_MAX = 500;

/** Turns of prior conversation replayed with a follow-up. Older turns are dropped. */
export const TEACHER_ASK_HISTORY_MAX = 6;

/** One replayed turn's cap; an AI turn is short by system-prompt rule. */
export const TEACHER_ASK_HISTORY_CONTENT_MAX = 2_000;

/** Which drawer asked: the class header's panel, or one student's. */
export const askScopeSchema = z.enum(['class', 'student']);

export const askHistoryTurnSchema = z.strictObject({
  role: z.enum(['teacher', 'ai']),
  content: z.string().trim().min(1).max(TEACHER_ASK_HISTORY_CONTENT_MAX),
});

/**
 * `student_document_id` is optional here and required by the SERVICE when the
 * scope is `student` (and refused when it is `class`) — the pairing rule the
 * published OpenAPI body cannot express as one plain object. The wrappers only
 * ever build the pairing their own scope allows.
 */
export const teacherAskBodySchema = z.strictObject({
  scope: askScopeSchema,
  class_document_id: documentId,
  student_document_id: documentId.optional(),
  question: z.string().trim().min(1).max(TEACHER_ASK_QUESTION_MAX),
  history: z.array(askHistoryTurnSchema).max(TEACHER_ASK_HISTORY_MAX).optional(),
});

/** The cohort the answer was built on: `scored` of `total` students, over `sittings`. */
export const askGroundingSchema = z.strictObject({
  scope: askScopeSchema,
  scored: count,
  total: count,
  sittings: count,
});

export const teacherAskResponseSchema = z.strictObject({
  answer: z.string().min(1),
  grounding: askGroundingSchema,
  refused: z.boolean(),
});
