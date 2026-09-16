import type { ResultView } from '@schooltest/scoring-contracts';

import { PHASE_LABEL_KEY, PHASE_SUB_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { PHASE_ORDER, SERVER_PHASE_MAP } from '@/modules/teacher/constants/v2-thresholds.constants';
import { PHASE_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import type { AcaraPhaseName, PhaseSource, PhaseView } from '@/modules/teacher/types/v2-view-common.types';

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

/**
 * The ACARA phase is the SERVER's crosswalk placement and nothing else. A null
 * `acara_phase` is the crosswalk's deliberate "no anchor evidence, no placement"
 * (API crosswalk D17) and renders as no phase. It used to fall back to portal
 * score cuts (80/62/45) that disagree with the crosswalk: a 58 read Developing for
 * a student the server placed and Emerging for one it did not place.
 */
export function phaseOfResult(result: ResultView | null): PhaseView | null {
  if (result === null) return null;
  const server = phaseFromServer(result.acara_phase);
  return server === null ? null : phaseView(server, 'server');
}

export function phaseRank(phase: PhaseView | null): number {
  return phase === null ? -1 : PHASE_ORDER.indexOf(phase.phase);
}
