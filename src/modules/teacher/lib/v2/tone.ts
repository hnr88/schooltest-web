import type { Band, ResultViewGate } from '@schooltest/scoring-contracts';

import { BAND_LABEL_KEY, GATE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { CLASS_MEAN_TONE_CUTS, CLASS_MEAN_TONE_FLOOR } from '@/modules/teacher/constants/v2-thresholds.constants';
import { BAND_TONE, GATE_TONE, UNASSESSED_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import type { GateView } from '@/modules/teacher/types/v2-student-detail.types';
import type { BandView, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

export function classMeanTone(mean: number | null): ViewTone {
  if (mean === null) return UNASSESSED_TONE;
  return BAND_TONE[CLASS_MEAN_TONE_CUTS.find((cut) => mean >= cut.min)?.band ?? CLASS_MEAN_TONE_FLOOR];
}

export function bandView(status: Band | null): BandView | null {
  if (status === null || status === 'not_assessed') return null;
  return { band: status, labelKey: BAND_LABEL_KEY[status], tone: BAND_TONE[status] };
}

export function gateView(gate: ResultViewGate): GateView | null {
  if (gate.domain_score === null || gate.passed === null) return null;
  const state = gate.passed ? 'passed' : 'notYet';
  return { passed: gate.passed, labelKey: GATE_LABEL_KEY[state], tone: GATE_TONE[state] };
}
