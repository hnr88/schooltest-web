import type { RubricOutput } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — presentation helpers for the review drawer. They live here
// rather than in the components because they use no hooks and the module
// pattern puts pure functions in lib/.

/**
 * Seconds from the stored milliseconds. The unit conversion is a PRESENTATION
 * concern, which is why the wire keeps `latency_ms` and this is the only place
 * that divides. `null` stays `null` — a missing latency is not zero seconds.
 */
export const secsOf = (latencyMs: number | null): string | null =>
  latencyMs === null ? null : (latencyMs / 1000).toFixed(1);

/**
 * Whether the marking assist DECLINED to suggest a mark.
 *
 * Only two of the four outcomes decline: a blank attempt (the device dropped
 * out and the question was never opened) and a language switch (the reasoning
 * is not in the assessed language). The other two — above the rubric ceiling,
 * and answering a different question — carry a NOTE and still suggest, because
 * there is real evidence to mark against. Getting this backwards would either
 * hide a suggestion the teacher should see or offer one where the design says
 * no mark can honestly be proposed.
 */
export const isDeclined = (rubric: RubricOutput): boolean =>
  rubric.decline_kind === 'blank' || rubric.decline_kind === 'language';

/** Correct answers among the served rows — a COUNT of server judgements. */
export const correctCount = (items: readonly { is_correct: boolean | null }[]): number =>
  items.filter((item) => item.is_correct === true).length;
