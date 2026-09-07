import { testVariantSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { ProgressDirection } from '@/modules/teacher/types/student-drill-down.types';
import type {
  StudentProgress,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';
import type {
  AcaraShiftView,
  DrillDownTestsView,
} from '@/modules/teacher/types/student-drill-down.types';

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
