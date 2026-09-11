import {
  ANALYSIS_GROWTH_KEY,
  GROWTH_TILE_KEY,
  OVERALL_DELTA_KEY,
  SUBSKILL_DELTA_KEY,
} from '@/modules/teacher/constants/student-detail.constants';
import { BAND_LABEL_KEY, GROWTH_STEADY_KEY, PHASE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ProgressTile, TextDescriptor } from '@/modules/teacher/types/student-drill-down.types';
import type {
  StudentDetailTiles,
  StudentDetailView,
  SubskillDelta,
  VocabStrands,
} from '@/modules/teacher/types/v2-student-detail.types';
import type { GrowthView } from '@/modules/teacher/types/v2-view-common.types';

// The student page's copy, built only from the `studentDetail()` view of one
// GET /results/:id. Every sentence and label is a key plus the real values that
// fill it; a missing value drops the sentence or prints the dash, never a number.

const STEADY: TextDescriptor = { ns: 'viewModel', key: GROWTH_STEADY_KEY };

function percent(value: number | null): TextDescriptor | null {
  return value === null ? null : { key: 'percent', values: { value } };
}

function signedGrowth(growth: GrowthView, keys: Readonly<Record<'up' | 'down' | 'flat', string>>): TextDescriptor | null {
  if (growth.kind === 'steady') return STEADY;
  if (growth.kind === 'none' || growth.points === null) return null;
  if (growth.kind === 'flat') return { key: keys.flat };
  return { key: keys[growth.kind], values: { points: Math.abs(growth.points) } };
}

export function overallDeltaText(growth: GrowthView): TextDescriptor | null {
  return signedGrowth(growth, OVERALL_DELTA_KEY);
}

export function subskillDeltaText(delta: SubskillDelta): TextDescriptor | null {
  if (delta.kind === 'none') return null;
  if (delta.kind === 'steady') return STEADY;
  if (delta.kind === 'bands') {
    // A band "movement" that stays inside one band is flat, never "Not yet → Not yet".
    if (delta.before === delta.after) return { key: SUBSKILL_DELTA_KEY.flat };
    return { key: 'subskills.deltaBands', labels: { before: BAND_LABEL_KEY[delta.before], after: BAND_LABEL_KEY[delta.after] } };
  }
  if (delta.points === 0) return { key: SUBSKILL_DELTA_KEY.flat };
  return { key: delta.points > 0 ? SUBSKILL_DELTA_KEY.up : SUBSKILL_DELTA_KEY.down, values: { points: Math.abs(delta.points) } };
}

export function strandsText(strands: VocabStrands | null): TextDescriptor | null {
  if (strands === null) return null;
  const { a2, b1 } = strands;
  if (a2 !== null && b1 !== null) return { key: 'subskills.strands', values: { a2, b1 } };
  if (a2 !== null) return { key: 'subskills.strandA2', values: { a2 } };
  if (b1 !== null) return { key: 'subskills.strandB1', values: { b1 } };
  return null;
}

function dated(key: string, satAt: string | null): TextDescriptor {
  return satAt === null ? { key: `${key}Undated` } : { key, months: { month: satAt } };
}

function sittingsText({ count, since }: StudentDetailTiles['sittings']): TextDescriptor | null {
  if (count === 0) return null;
  return since === null
    ? { key: 'tiles.sittingsCount', values: { count } }
    : { key: 'tiles.sittingsSince', values: { count }, months: { month: since } };
}

export function progressTiles(view: StudentDetailView): ProgressTile[] {
  const { baseline, latest, growth, sittings } = view.tiles;
  return [
    { id: 'baseline', label: dated('tiles.baseline', baseline?.satAt ?? null), value: percent(baseline?.value ?? null), fg: null },
    { id: 'latest', label: dated('tiles.latest', latest.satAt), value: percent(latest.value), fg: null },
    { id: 'growth', label: { key: 'tiles.growth' }, value: signedGrowth(growth, GROWTH_TILE_KEY), fg: growth.fg },
    { id: 'sittings', label: { key: 'tiles.sittings' }, value: sittingsText(sittings), fg: null },
  ];
}

function growthSentence(growth: GrowthView): TextDescriptor | null {
  if (growth.kind === 'steady') return { key: ANALYSIS_GROWTH_KEY.steady };
  if (growth.kind === 'flat') return { key: ANALYSIS_GROWTH_KEY.flat };
  if (growth.kind === 'none' || growth.points === null) return null;
  const keys = ANALYSIS_GROWTH_KEY[growth.kind];
  return { key: growth.reliable === true ? keys.reliable : keys.plain, values: { points: Math.abs(growth.points) } };
}

function overallParagraph(view: StudentDetailView, first: string): TextDescriptor[] {
  const { score, growth } = view.overall;
  if (score === null) return [];
  const opening: TextDescriptor =
    view.phase === null
      ? { key: 'analysis.overallNoPhase', values: { first, score } }
      : { key: 'analysis.overall', values: { first, score }, labels: { phase: PHASE_LABEL_KEY[view.phase.phase] } };
  const change = growthSentence(growth);
  return change === null ? [opening] : [opening, change];
}

function focusParagraph(view: StudentDetailView, first: string): TextDescriptor[] {
  const { strongest, weakest } = view.analysis;
  if (strongest === null || weakest === null || strongest.skill === weakest.skill) return [];
  return [
    {
      key: 'analysis.strengthFocus',
      values: { first, strongestScore: strongest.score, weakestScore: weakest.score },
      lowerLabels: { strongest: strongest.labelKey, weakest: weakest.labelKey },
    },
    { key: 'analysis.focusNext', values: { first }, lowerLabels: { weakest: weakest.labelKey } },
  ];
}

function vocabParagraph(view: StudentDetailView, first: string): TextDescriptor[] {
  const { a2, b1 } = view.analysis.vocab;
  if (a2 !== null && b1 !== null) {
    const both: TextDescriptor = { key: 'analysis.vocabBoth', values: { a2, b1 } };
    return b1 < a2 ? [both, { key: 'analysis.vocabAcademicNext', values: { first } }] : [both];
  }
  if (a2 !== null) return [{ key: 'analysis.vocabA2Only', values: { a2 } }];
  if (b1 !== null) return [{ key: 'analysis.vocabB1Only', values: { b1 } }];
  return [];
}

/** The analysis by topic (what changed, where to focus, vocabulary); a topic with no value is empty. */
export function analysisTopics(
  view: StudentDetailView,
  first: string,
): Readonly<Record<'change' | 'focus' | 'vocab', TextDescriptor[]>> {
  return { change: overallParagraph(view, first), focus: focusParagraph(view, first), vocab: vocabParagraph(view, first) };
}

/** The "Student analysis" card: up to three paragraphs, each a list of sentences. */
export function studentAnalysis(view: StudentDetailView, first: string): TextDescriptor[][] {
  const topics = analysisTopics(view, first);
  return [topics.change, topics.focus, topics.vocab].filter((paragraph) => paragraph.length > 0);
}
