import type { ResultView } from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, secureCounts, subskillAverages } from '@/modules/results';

import { CLASS_FLAG_LABEL_KEY, SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { CLASS_FLAG_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { classMeanTone } from '@/modules/teacher/lib/v2/tone';
import type { MasteryFlagKind, MasteryRow } from '@/modules/teacher/types/v2-insights.types';

interface MeasuredRow {
  row: MasteryRow;
  average: number | null;
}

function flagged(row: MasteryRow, kind: MasteryFlagKind): MasteryRow {
  return { ...row, flag: { kind, labelKey: CLASS_FLAG_LABEL_KEY[kind], tone: CLASS_FLAG_TONE[kind] } };
}

function gatePassedCount(results: readonly ResultView[]): number | null {
  const scored = results.filter((result) => result.gate.domain_score !== null);
  return scored.length === 0 ? null : scored.filter((result) => result.gate.passed === true).length;
}

function measuredRows(results: readonly ResultView[]): MeasuredRow[] {
  const averages = new Map(subskillAverages(results).map((entry) => [entry.skill, entry]));
  const secure = new Map(secureCounts(results).map((entry) => [entry.skill, entry.secure]));
  const gatePassed = gatePassedCount(results);
  return DISPLAY_SKILL_ORDER.map((skill) => {
    const average = averages.get(skill);
    const mean = average === undefined ? null : Math.round(average.average);
    const isGate = skill === 'Critical';
    return {
      average: average === undefined ? null : average.average,
      row: {
        skill,
        labelKey: SKILL_LABEL_KEY[skill],
        mean,
        assessed: average === undefined ? 0 : average.assessed,
        secure: isGate ? null : (secure.get(skill) ?? null),
        gatePassed: isGate ? gatePassed : null,
        tone: classMeanTone(mean),
        flag: null,
      },
    };
  });
}

function fewestSecureFirst(a: MeasuredRow, b: MeasuredRow): number {
  return (a.row.secure ?? 0) - (b.row.secure ?? 0) || (a.average ?? 0) - (b.average ?? 0);
}

export function readingMastery(results: readonly ResultView[]): MasteryRow[] {
  const rows = measuredRows(results);
  const ranked = rows.filter((entry) => entry.row.skill !== 'Critical' && entry.average !== null).sort(fewestSecureFirst);
  const rest = rows.filter((entry) => !ranked.includes(entry)).map((entry) => entry.row);
  const flaggedRanked = ranked.map((entry, index) => {
    if (index === 0) return flagged(entry.row, 'focus');
    return index === ranked.length - 1 ? flagged(entry.row, 'strength') : entry.row;
  });
  return [...flaggedRanked, ...rest];
}
