import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import { displaySkills, type RosterRow } from '@/modules/results';
import { NEXT_PHASE } from '@/modules/teacher/constants/teaching.constants';
import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { BAND_RANK, PHASE_ORDER } from '@/modules/teacher/constants/v2-thresholds.constants';
import { BAND_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { assessedBandOf } from '@/modules/teacher/lib/v2/skill-refs';
import { limitingSkill, teachingStudent } from '@/modules/teacher/lib/v2/teaching/skills';
import type { TeachingNextStep, TeachingStrand, TeachingTarget } from '@/modules/teacher/types/teaching-plan.types';

function targetFor(
  result: ResultView,
  strand: TeachingStrand,
  means: ReadonlyMap<DisplaySkill, number>,
): TeachingTarget | null {
  const skill = limitingSkill(result, strand, means);
  const band = skill === null ? null : assessedBandOf(result, skill);
  if (skill === null || band === null) return null;
  const phase = PHASE_ORDER[BAND_RANK[band]];
  return {
    skill,
    labelKey: SKILL_LABEL_KEY[skill],
    band,
    phase,
    nextPhase: NEXT_PHASE[phase],
    tone: BAND_TONE[band],
    provisionalCut: skill === 'Vocab_B2' && result.academic_vocab.provisional_cut,
  };
}

export function teachingNextSteps(
  roster: readonly RosterRow[],
  means: ReadonlyMap<DisplaySkill, number>,
): TeachingNextStep[] {
  return roster.flatMap((row) => {
    const result = row.result;
    if (result === null) return [];
    if (result.overall.domain_score === null && displaySkills(result).every((tile) => tile.domain_score === null)) return [];
    const vocabulary = targetFor(result, 'vocabulary', means);
    const comprehension = targetFor(result, 'comprehension', means);
    // No banded vocabulary or comprehension subskill → no next step to name (and no empty prompt).
    if (vocabulary === null && comprehension === null) return [];
    return [{ ...teachingStudent(row), vocabulary, comprehension }];
  });
}
