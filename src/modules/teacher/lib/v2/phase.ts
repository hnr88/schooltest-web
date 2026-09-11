import type { ResultView } from '@schooltest/scoring-contracts';

import { PHASE_LABEL_KEY, PHASE_SUB_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import {
  PHASE_ORDER,
  PHASE_SCORE_CUTS,
  PHASE_SCORE_FLOOR,
  SERVER_PHASE_MAP,
} from '@/modules/teacher/constants/v2-thresholds.constants';
import { PHASE_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import type { AcaraPhaseName, PhaseSource, PhaseView } from '@/modules/teacher/types/v2-view-common.types';

export function phaseFromScore(score: number): AcaraPhaseName {
  return PHASE_SCORE_CUTS.find((cut) => score >= cut.min)?.phase ?? PHASE_SCORE_FLOOR;
}

/** A served phase code or label ("developing_to_consolidating", "Developing phase") → design phase; null when unknown. */
export function phaseFromServer(value: string | null): AcaraPhaseName | null {
  if (value === null) return null;
  return SERVER_PHASE_MAP[value.trim().toLowerCase().replace(/\s+phase$/, '')] ?? null;
}

export function phaseView(phase: AcaraPhaseName, source: PhaseSource): PhaseView {
  return {
    phase,
    source,
    labelKey: PHASE_LABEL_KEY[phase],
    subLabelKey: PHASE_SUB_LABEL_KEY[phase],
    tone: PHASE_TONE[phase],
  };
}

export function phaseOfResult(result: ResultView | null): PhaseView | null {
  if (result === null) return null;
  const server = phaseFromServer(result.acara_phase);
  if (server !== null) return phaseView(server, 'server');
  const score = result.overall.domain_score;
  return score === null ? null : phaseView(phaseFromScore(score), 'score');
}

export function phaseRank(phase: PhaseView | null): number {
  return phase === null ? -1 : PHASE_ORDER.indexOf(phase.phase);
}
