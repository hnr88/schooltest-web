import { scoredCount, weakestSkill, type RosterRow } from '@/modules/results';

import { growthFromServer } from '@/modules/teacher/lib/v2/growth';
import { phaseOfResult, phaseRank } from '@/modules/teacher/lib/v2/phase';
import { toScoredSkill } from '@/modules/teacher/lib/v2/skill-refs';
import type {
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
