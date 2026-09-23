import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import { resolveAttributeDelta, type AttributeDeltaView } from '@/modules/report';
import { displaySkills, strongestSkill, weakestSkill, type DisplaySkillReading } from '@/modules/results';

import { SKILL_BLURB_KEY, SKILL_LABEL_KEY, STUDENT_TAG_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { BAND_RANK } from '@/modules/teacher/constants/v2-thresholds.constants';
import { GROWTH_FG, STUDENT_TAG_TONE, UNASSESSED_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { sparkline } from '@/modules/teacher/lib/v2/chart-geometry';
import { parseSignedDisplay, signedFg } from '@/modules/teacher/lib/v2/growth';
import { skillOf, studentSeries } from '@/modules/teacher/lib/v2/history-series';
import { assessedBandOf, isAttributeName } from '@/modules/teacher/lib/v2/skill-refs';
import { bandView, gateView } from '@/modules/teacher/lib/v2/tone';
import type {
  SubskillCard,
  SubskillDelta,
  SubskillTag,
  VocabStrands,
} from '@/modules/teacher/types/v2-student-detail.types';

function fromAttributeDelta(view: AttributeDeltaView | null): SubskillDelta {
  if (view === null || view.kind === 'band_movement') return { kind: 'none' };
  if (view.kind === 'steady') return { kind: 'steady', fg: GROWTH_FG.steady };
  if (view.kind === 'bands') {
    return { kind: 'bands', before: view.before, after: view.after, fg: signedFg(BAND_RANK[view.after] - BAND_RANK[view.before]) };
  }
  const points = parseSignedDisplay(view.display);
  return points === null ? { kind: 'none' } : { kind: 'points', points, fg: signedFg(points) };
}

function deltaOf(result: ResultView, tile: DisplaySkillReading): SubskillDelta {
  if (tile.source === 'gate' || !isAttributeName(tile.skill)) return { kind: 'none' };
  const entry = result.attributes[tile.skill];
  return entry === undefined ? { kind: 'none' } : fromAttributeDelta(resolveAttributeDelta(entry));
}

function tagFor(skill: DisplaySkill, strongest: DisplaySkill | null, weakest: DisplaySkill | null): SubskillTag | null {
  if (strongest === weakest) return null;
  const kind = skill === strongest ? 'strength' : skill === weakest ? 'focus' : null;
  return kind === null ? null : { kind, labelKey: STUDENT_TAG_LABEL_KEY[kind], tone: STUDENT_TAG_TONE[kind] };
}

export function vocabStrands(result: ResultView): VocabStrands {
  return { a2: assessedBandOf(result, 'Vocab_A2'), b1: assessedBandOf(result, 'Vocab_B1') };
}

export function subskillCards(result: ResultView): SubskillCard[] {
  const strongest = strongestSkill(result)?.skill ?? null;
  const weakest = weakestSkill(result)?.skill ?? null;
  return displaySkills(result).map((tile) => {
    const band = tile.source === 'gate' ? null : bandView(tile.status);
    const gate = tile.source === 'gate' ? gateView(result.gate) : null;
    const trajectory = studentSeries(result, skillOf(tile.skill)).map((point) => point.value);
    return {
      skill: tile.skill,
      labelKey: SKILL_LABEL_KEY[tile.skill],
      blurbKey: SKILL_BLURB_KEY[tile.skill],
      score: tile.domain_score,
      band,
      gate,
      barTone: band?.tone ?? gate?.tone ?? UNASSESSED_TONE,
      delta: deltaOf(result, tile),
      trajectory,
      spark: sparkline(trajectory),
      tag: tagFor(tile.skill, strongest, weakest),
    };
  });
}
