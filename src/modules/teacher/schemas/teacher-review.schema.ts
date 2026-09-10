import { z } from 'zod';

// TEACHER REVIEW — client mirror of C-REV-1 (schooltest-api/src/contracts/
// review.ts), name for name and field for field. `teacher-contract-parity`
// diffs the exported name sets and, for every shared name, the object field
// names and the enum options — so this file is judged mechanically, not
// editorially.
//
// WHAT IS MIRRORED EXACTLY: every exported name, every field name, and every
// enum option. The four decline kinds and the five response kinds are spelled
// out here because the parity spec compares option lists, and because a client
// that silently accepted a fifth decline kind would render an unlabelled state.
//
// WHERE THE MIRROR IS DELIBERATELY SHALLOWER, AND WHY IT IS STILL HONEST: the
// answer key's SIX arms are discriminated on `type` and their payload shapes
// are the item bank's business (block rules, d-prime thresholds, normaliser
// names). The drawer renders the discriminator and the answer, never the
// scoring internals, so the arms are mirrored by their discriminator with
// permissive payloads. That keeps the leak guard where it matters — the
// envelope is strict, so an unlisted TOP-LEVEL key still fails the parse —
// without this file claiming to re-validate rules it does not implement. A
// deeper copy would drift from the bank the first time an arm gains a field,
// and drift that looks like validation is worse than an honest boundary.
const str = z.string().min(1);

/** The design's four decline outcomes; the design's `over` is `over_ceiling` on the wire. */
export const rubricDeclineKindSchema = z.enum(['over_ceiling', 'blank', 'language', 'offtopic']);
export type RubricDeclineKind = z.infer<typeof rubricDeclineKindSchema>;

/** CT-6's five response kinds. */
export const reviewResponseKindSchema = z.enum(['mc', 'binary', 'text', 'audio', 'match']);
export type ReviewResponseKind = z.infer<typeof reviewResponseKindSchema>;

/** The answer key, by discriminator. See the note above on mirror depth. */
export const correctKeySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single') }).passthrough(),
  z.object({ type: z.literal('multi') }).passthrough(),
  z.object({ type: z.literal('block_rule') }).passthrough(),
  z.object({ type: z.literal('match_partial') }).passthrough(),
  z.object({ type: z.literal('constructed') }).passthrough(),
  z.object({ type: z.literal('provider_scored') }).passthrough(),
]);
export type CorrectKey = z.infer<typeof correctKeySchema>;

/** CT-6 response flags, field for field. */
export const responseFlagsSchema = z.strictObject({
  timeout: z.boolean(),
  tts_used: z.boolean(),
  accommodation: z.record(z.string(), z.unknown()).nullable(),
});
export type ResponseFlags = z.infer<typeof responseFlagsSchema>;

/**
 * Task 07's frozen marking-assist body. `dimensions` is absent or null on a
 * decline and is NEVER zero-filled — a zero band is a judgement, an absent one
 * is a refusal to judge, and the drawer must not render the second as the first.
 */
export const rubricOutputSchema = z.strictObject({
  provider: z.enum(['writing_llm']),
  rubric_ref: str,
  rubric_version: z.number().int().min(0),
  model: str,
  scored_at: str,
  dimensions: z.record(str, z.number().int()).nullable().optional(),
  rationale: z.record(str, str).optional(),
  /** The EXACT student text the model read, one entry per dimension. */
  evidence: z.record(str, str).optional(),
  decline_kind: rubricDeclineKindSchema.optional(),
  decline_reason: str.optional(),
}).superRefine((body, ctx) => {
  // The decline arm travels as a PAIR. Mirrored from the server rather than
  // trusted: a kind without its reason is an unrenderable half-state, and the
  // drawer would show a refusal with no explanation of it.
  const hasKind = body.decline_kind !== undefined;
  const hasReason = body.decline_reason !== undefined;
  if (hasKind !== hasReason) {
    ctx.addIssue({
      code: 'custom',
      path: hasKind ? ['decline_reason'] : ['decline_kind'],
      message: 'decline_kind and decline_reason are written together or not at all',
    });
  }
  // A body with no decline pair is a SCORED body: it carries bands. Absent
  // dimensions belong to declines only — never zero-filled, never missing.
  if (!hasKind && (body.dimensions === undefined || body.dimensions === null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['dimensions'],
      message: 'a scored rubric_score carries bands; absent dimensions requires the decline pair',
    });
  }
});
export type RubricOutput = z.infer<typeof rubricOutputSchema>;

/** One question row, in served order. */
export const reviewItemSchema = z.strictObject({
  sequence_index: z.number().int().min(0),
  item_code: str,
  prompt: str.nullable(),
  response_kind: reviewResponseKindSchema,
  task_type: str.nullable(),
  given: z.unknown(),
  /** `null` is NOT wrong — it is a row nobody has marked yet. */
  is_correct: z.boolean().nullable(),
  /** MILLISECONDS as served; the drawer divides for the seconds it shows. */
  latency_ms: z.number().int().min(0).nullable(),
  flags: responseFlagsSchema.nullable(),
  /** A SERVED label. Never re-derived in the browser. */
  area: str.nullable(),
  correct_key: correctKeySchema.nullable(),
  rubric_score: rubricOutputSchema.nullable(),
});
export type ReviewItem = z.infer<typeof reviewItemSchema>;

/** The whole review read. */
export const resultReviewSchema = z.strictObject({
  document_id: str,
  status: str,
  release_state: str,
  skill: str.nullable(),
  cefr_band: str.nullable(),
  item_count: z.number().int().min(0),
  items: z.array(reviewItemSchema),
}).superRefine((body, ctx) => {
  // The count is an ANCHOR: a projection that dropped a row would otherwise
  // render as a short sitting with nothing to distinguish it from a real one.
  if (body.item_count !== body.items.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['item_count'],
      message: 'item_count states the number of rows served',
    });
  }
  // Order is part of the contract — the drawer renders as given, never sorts.
  for (let i = 1; i < body.items.length; i += 1) {
    if (body.items[i].sequence_index <= body.items[i - 1].sequence_index) {
      ctx.addIssue({
        code: 'custom',
        path: ['items', i, 'sequence_index'],
        message: 'rows are served in ascending sequence_index order',
      });
    }
  }
});
export type ResultReview = z.infer<typeof resultReviewSchema>;
