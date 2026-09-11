import { resultViewsOf, vocabStrandMeans, type RosterRow } from '@/modules/results';

import { PHASE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { COHORT_GROWTH_THRESHOLD, PHASE_ORDER } from '@/modules/teacher/constants/v2-thresholds.constants';
import { PHASE_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { growthCounts, serverDeltas } from '@/modules/teacher/lib/v2/growth';
import { phaseOfResult } from '@/modules/teacher/lib/v2/phase';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';
import type { CohortView, PhaseBar } from '@/modules/teacher/types/v2-insights.types';

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function phaseBars(phases: readonly AcaraPhaseName[]): PhaseBar[] {
  return PHASE_ORDER.map((phase) => {
    const count = phases.filter((entry) => entry === phase).length;
    return {
      phase,
      labelKey: PHASE_LABEL_KEY[phase],
      count,
      width: phases.length === 0 ? 0 : Math.round((count / phases.length) * 100),
      fg: PHASE_TONE[phase].fg,
    };
  });
}

export function cohortAtAGlance(roster: readonly RosterRow[]): CohortView {
  const phases = roster.flatMap((row) => {
    const phase = phaseOfResult(row.result);
    return phase === null ? [] : [phase.phase];
  });
  const results = resultViewsOf(roster);
  const growth = growthCounts(serverDeltas(results), COHORT_GROWTH_THRESHOLD);
  const vocab = vocabStrandMeans(results);
  return {
    phases: phaseBars(phases),
    phased: phases.length,
    growth: { improved: growth.up, held: growth.held, slipped: growth.down, paired: growth.paired },
    vocab: {
      a2: roundOrNull(vocab.a2.average),
      a2Assessed: vocab.a2.assessed,
      b1: roundOrNull(vocab.b1.average),
      b1Assessed: vocab.b1.assessed,
    },
  };
}
