'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { progressDelta } from '@/modules/teacher/lib/class-progress';
import { acaraShift } from '@/modules/teacher/lib/student-drill-down';
import type { ProgressStatItem } from '@/modules/teacher/types/class-progress.types';
import type { StudentComparisonStripProps } from '@/modules/teacher/types/student-drill-down.types';

/**
 * The three cells of .qa/DESIGN.md §Both tests completed: `Overall score 72 → 81
 * ↑9`, `ACARA phase Developing → Consolidating`, `5 subskills improved · 2 stable
 * · 0 regressed`.
 *
 * Every number is C-TR-2's own. The two scores are the tests' `score` fields, the
 * arrow's magnitude is `progress.score_delta` and the three counts are
 * `progress.improved / stable / regressed` — SUBSKILL COUNTS, not booleans. The
 * hook recomputes none of them: it never subtracts the two scores (the server's
 * `score_delta` is the authority, and it exists only because the A/B forms are
 * equated), and it never compares a likelihood to a mastery cut.
 *
 * A `null` score or a `null` phase name yields the explicit "Not available"
 * string, never a 0 and never a guessed phase. The phase cell carries the WORD
 * ("Same phase" / "Phase changed") as its note, which is a string equality on the
 * two names the server sent — the wireframe's `↑` is deliberately absent, because
 * ordering ACARA phases would need a client-side ladder this surface forbids.
 */
export function useDrillDownComparison({
  progress,
  earlier,
  latest,
}: StudentComparisonStripProps): ProgressStatItem[] {
  const t = useTranslations('Teacher.results.drillDown');
  const format = useFormatter();
  const score = progressDelta(progress.score_delta);
  const phase = acaraShift(progress);

  const scoreValue =
    earlier.score === null || latest.score === null
      ? t('valueUnavailable')
      : t('scoreArrow', { from: earlier.score, to: latest.score });

  return [
    {
      key: 'overall-score',
      label: t('scoreLabel'),
      value: scoreValue,
      direction: score.direction,
      change: format.number(score.magnitude),
      note: null,
    },
    {
      key: 'acara-phase',
      label: t('statAcaraPhase'),
      value:
        phase.kind === 'moved'
          ? t('scoreArrow', { from: phase.from, to: phase.to })
          : phase.kind === 'same'
            ? phase.phase
            : t('valueUnavailable'),
      direction: null,
      change: null,
      note: phase.kind === 'unknown' ? null : t(phase.kind === 'same' ? 'phaseSame' : 'phaseMoved'),
    },
    {
      key: 'subskills',
      label: t('statSubskills'),
      value: t('subskillCounts', {
        improved: progress.improved,
        stable: progress.stable,
        regressed: progress.regressed,
      }),
      direction: null,
      change: null,
      note: null,
    },
  ];
}
