import { scoredCount, weakestSkill, type RosterRow } from '@/modules/results';

import { growthFromServer } from '@/modules/teacher/lib/v2/growth';
import { phaseOfResult, phaseRank } from '@/modules/teacher/lib/v2/phase';
import { toScoredSkill } from '@/modules/teacher/lib/v2/skill-refs';
import type {
  StudentNoScoreReason,
  StudentsSort,
  StudentsTabOptions,
  StudentsTabRow,
  StudentsTabView,
} from '@/modules/teacher/types/v2-class-tabs.types';

type RowOrder = (a: StudentsTabRow, b: StudentsTabRow) => number;

const byName: RowOrder = (a, b) => a.name.localeCompare(b.name);

function byScore(direction: 1 | -1): RowOrder {
  return (a, b) => {
    if (a.score === null || b.score === null) {
      if (a.score === b.score) return byName(a, b);
      return a.score === null ? 1 : -1;
    }
    return (a.score - b.score) * direction || byName(a, b);
  };
}

const ROW_ORDER: Readonly<Record<StudentsSort, RowOrder>> = {
  name: byName,
  high: byScore(-1),
  low: byScore(1),
  phase: (a, b) => phaseRank(b.phase) - phaseRank(a.phase) || byName(a, b),
};

/**
 * The result's own state says why it carries no score (the desktop's attempt
 * reasons, app cc6e6e2): still being scored, scoring failed, or — for a
 * complete row — how many items were really answered (`items_answered` never
 * counts not-reached items). A teacher sees held results, so "held" is no reason here.
 */
function noScoreReasonOf(result: RosterRow['result'], score: number | null): StudentNoScoreReason | null {
  if (result === null || score !== null) return null;
  if (result.status === 'scoring_failed' || result.status === 'manual_scoring') return 'failed';
  if (result.status !== 'complete') return 'pending';
  return result.items_answered === 0 ? 'no_answers' : 'too_few_answers';
}

export function studentsTabRow(row: RosterRow): StudentsTabRow {
  const { result, student } = row;
  const score = result === null ? null : result.overall.domain_score;
  return {
    studentDocumentId: student.document_id,
    resultDocumentId: result === null ? null : result.document_id,
    name: student.name,
    initials: student.initials,
    ealdFlag: student.eald_flag,
    score,
    growth: growthFromServer(result === null ? null : result.overall),
    weakest: result === null ? null : toScoredSkill(weakestSkill(result)),
    phase: phaseOfResult(result),
    hasResult: result !== null,
    isScored: score !== null,
    noScoreReason: noScoreReasonOf(result, score),
  };
}

export function studentsTabRows(roster: readonly RosterRow[], options: StudentsTabOptions = {}): StudentsTabView {
  const query = (options.query ?? '').trim().toLowerCase();
  const rows = roster.map(studentsTabRow);
  const matched = query === '' ? rows : rows.filter((row) => row.name.toLowerCase().includes(query));
  const { scored, total } = scoredCount(roster);
  return {
    rows: [...matched].sort(ROW_ORDER[options.sort ?? 'name']),
    total,
    matched: matched.length,
    scored,
  };
}
