import type {
  DirectoryClientConfig,
  DirectorySortDef,
} from '@/modules/directory';

import type {
  DiagnosticAttribute,
  DiagnosticMasteryRow,
  DiagnosticStatus,
} from '@/modules/teach/types/diagnostic.types';

// ops/33 — the mastery surface's directory configuration, so MasteryTable
// stays a renderer. The C-RPT-01 endpoint serves no list params (D-27), so
// the kit's `client` mode reduces the loaded array. Sorting a subskill column
// sorts the WHOLE loaded set (the reducer runs before the page window).
//
// Status rank is the drill-down's own ORDER semantics, not a score: mastered
// above emerging above not mastered. `not_assessed` and a missing attribute
// rank UNRANKED — the design's "Not sat" rule: an absence never masquerades
// as a low score, so it sorts last in BOTH directions, never against the
// assessed rows (task 50's sentinel, and mvp spec: absence is never a zero).

export const MASTERY_AREA_CODES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const;

export type MasteryAreaCode = (typeof MASTERY_AREA_CODES)[number];

const STATUS_RANK: Record<DiagnosticStatus, number | null> = {
  mastered: 2,
  emerging: 1,
  not_mastered: 0,
  not_assessed: null,
};

const UNRANKED = Number.POSITIVE_INFINITY;

function attributeRank(row: DiagnosticMasteryRow, code: string): number | null {
  const attribute: DiagnosticAttribute | undefined = row.attributes.find(
    (entry) => entry.code === code,
  );
  if (!attribute) return null;
  return STATUS_RANK[attribute.status];
}

function byStudentRef(a: DiagnosticMasteryRow, b: DiagnosticMasteryRow): number {
  return a.student_ref.localeCompare(b.student_ref) || a.student_document_id.localeCompare(b.student_document_id);
}

function areaComparator(code: string, direction: 1 | -1) {
  // The unranked key stays +Infinity in BOTH directions: negating the rank
  // (for strongest-first) must not negate the absence with it — Infinity *
  // -1 would put the unassessed rows FIRST, i.e. read absence as the best
  // possible score. Two unranked rows are a name tie, never Infinity-Infinity.
  return (a: DiagnosticMasteryRow, b: DiagnosticMasteryRow): number => {
    const rankA = attributeRank(a, code);
    const rankB = attributeRank(b, code);
    if (rankA === null && rankB === null) return byStudentRef(a, b);
    const keyA = rankA === null ? UNRANKED : rankA * direction;
    const keyB = rankB === null ? UNRANKED : rankB * direction;
    return keyA - keyB || byStudentRef(a, b);
  };
}

const MASTERY_COMPARATORS: Record<string, (a: DiagnosticMasteryRow, b: DiagnosticMasteryRow) => number> = {
  'name:asc': byStudentRef,
  'name:desc': (a, b) => byStudentRef(b, a),
};

for (const code of MASTERY_AREA_CODES) {
  MASTERY_COMPARATORS[`${code}:asc`] = areaComparator(code, 1);
  MASTERY_COMPARATORS[`${code}:desc`] = areaComparator(code, -1);
}

export interface MasterySortLabels {
  nameAsc: string;
  nameDesc: string;
  weakest: (areaLabel: string) => string;
  strongest: (areaLabel: string) => string;
  areaLabel: (code: string) => string;
}

export function masterySorts(labels: MasterySortLabels): readonly DirectorySortDef[] {
  const sorts: DirectorySortDef[] = [
    { value: 'name:asc', label: labels.nameAsc },
    { value: 'name:desc', label: labels.nameDesc },
  ];
  for (const code of MASTERY_AREA_CODES) {
    const areaLabel = labels.areaLabel(code);
    sorts.push(
      { value: `${code}:asc`, label: labels.weakest(areaLabel) },
      { value: `${code}:desc`, label: labels.strongest(areaLabel) },
    );
  }
  return sorts;
}

export const masteryClientConfig: DirectoryClientConfig<DiagnosticMasteryRow> = {
  searchText: (row) => [row.student_ref],
  comparators: MASTERY_COMPARATORS,
};
