import { progressDelta } from '@/modules/teacher/lib/class-progress';
import { testVariantSchema } from '@/modules/teacher/schemas/teacher.schema';
import type {
  StudentProgress,
  StudentSubskill,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';
import type {
  AcaraShiftView,
  DrillDownTestsView,
  SubskillDeltaView,
  SubskillTileView,
} from '@/modules/teacher/types/student-drill-down.types';

/**
 * Chooses which of the two tile arms one C-TR-2 subskill may be drawn as.
 *
 * This is the ONLY branch the drill-down makes over a subskill, and it is a
 * PRESENCE test, never a threshold: `likelihood === null` (the `'not_assessed'`
 * sentinel, per .qa/CONTRACTS.md "Vocabulary") means this result never measured
 * the attribute, so the tile prints no percentage. Otherwise the server's own
 * integer `likelihood` and the server's own `status` band are passed through
 * verbatim.
 *
 * The 80% / 50% mastery cuts are `Config.teacher_mastery_bands` and were applied
 * server-side by `mastery_band(prob)` before `status` was ever sent. Deriving a
 * band here — from `likelihood`, or from the `bands` C-TR-2 echoes for the legend
 * — would be exactly the hardcoded threshold the brief forbids.
 */
export function subskillTileView(subskill: StudentSubskill): SubskillTileView {
  if (subskill.likelihood === null) return { measured: false, status: subskill.status };
  return { measured: true, likelihood: subskill.likelihood, status: subskill.status };
}

/**
 * The `was 62% ↑16` line, or `null` when this attribute has no reportable
 * comparison.
 *
 * BOTH server fields are required. `delta` is C-TR-2's own integer — this
 * function reads its SIGN and its magnitude for display and never computes it:
 * `likelihood - previous_likelihood` is forbidden here, because a `null` from the
 * server means "not comparable" (F-EQUATING-GATE: the A/B pair is unequated, so
 * the difference of the two DINA posteriors may not be reported) and computing it
 * anyway would manufacture exactly the number the platform suppressed.
 */
export function subskillDeltaView(subskill: StudentSubskill): SubskillDeltaView | null {
  if (subskill.previous_likelihood === null || subskill.delta === null) return null;
  const { direction, magnitude } = progressDelta(subskill.delta);
  return { previous: subskill.previous_likelihood, direction, magnitude };
}

/**
 * Splits C-TR-2's `tests` into the newest test and the ones that collapse.
 *
 * The array arrives MOST RECENT FIRST (.qa/CONTRACTS.md C-TR-2), so this is an
 * index split — `tests[0]` renders in full with its deltas, the rest collapse to
 * a summary row. No `variant` is compared and nothing is re-sorted: the recency
 * authority is the server's ordering.
 *
 * `null` when the array is EMPTY — the server's own "no completed test yet",
 * which the screen renders as its empty state rather than as a zeroed card.
 */
export function drillDownTests(tests: readonly StudentTestResult[]): DrillDownTestsView | null {
  const [latest, ...earlier] = tests;
  if (!latest) return null;
  const present = new Set(tests.map((test) => test.variant));
  return {
    latest,
    earlier,
    missing: testVariantSchema.options.filter((variant) => !present.has(variant)),
  };
}

/**
 * `progress.acara_from` → `acara_to` as the strip may state it.
 *
 * Both names are printed VERBATIM from C-TR-2 (they are the active crosswalk's
 * phase labels). The only comparison is string equality, which needs no ordering
 * knowledge; a missing name yields `unknown` and the strip says so instead of
 * guessing a phase.
 */
export function acaraShift(progress: StudentProgress): AcaraShiftView {
  const { acara_from: from, acara_to: to } = progress;
  if (from === null || to === null) return { kind: 'unknown' };
  return from === to ? { kind: 'same', phase: to } : { kind: 'moved', from, to };
}
