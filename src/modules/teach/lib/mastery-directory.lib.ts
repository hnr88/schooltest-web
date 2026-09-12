import { MASTERY_AREA_CODES } from '@/modules/teach/constants/lib.constants';
import { diagnosticAreaCode } from '@/modules/teach/lib/diagnostic-areas';

import type {
  DirectoryClientConfig,
  DirectorySortDef,
} from '@/modules/directory';

import type {
  DiagnosticAttribute,
  DiagnosticMasteryRow,
  DiagnosticStatus,
} from '@/modules/teach/types/diagnostic.types';
import type { MasteryAreaCode } from '@/modules/teach/types/lib.types';

// ops/33 — the mastery surface's directory configuration, so MasteryTable
// stays a renderer. The C-RPT-01 endpoint serves no list params (D-27), so
// the kit's `client` mode reduces the loaded array. Sorting a subskill column
// sorts the WHOLE loaded set (the reducer runs before the page window).
//
// Status rank is the drill-down's own ORDER semantics, not a score: mastered
// above emerging above not mastered; the reading bands secure above developing
// above emerging above not yet. `not_assessed` and a missing attribute
// rank UNRANKED — the design's "Not sat" rule: an absence never masquerades
// as a low score, so it sorts last in BOTH directions, never against the
// assessed rows (task 50's sentinel, and mvp spec: absence is never a zero).

// The seven area codes and their type moved to `constants/lib.constants.ts` /
// `types/lib.types.ts` so `diagnostic-areas.ts` can read them without importing
// this file back. Re-exported here: this is still where the mastery surface
// (and the module barrel) reaches for them.
export { MASTERY_AREA_CODES };
export type { MasteryAreaCode };

const STATUS_RANK: Record<DiagnosticStatus, number | null> = {
  mastered: 2,
  emerging: 1,
  not_mastered: 0,
  not_assessed: null,
  secure: 3,
  developing: 2,
  not_yet: 0,
};

const UNRANKED = Number.POSITIVE_INFINITY;

/**
 * The attribute a mastery row puts on one reading area — the single source both
 * the table cell and the student drill-down read (TB-12).
 *
 * A live C-RPT-01 row names its cells by MODEL ATTRIBUTE (Decoding, Vocab_A2, …)
 * once the student is scored and by area code (R1..R7) while they are not, so an
 * area's cell is whichever of the row's attributes `diagnosticAreaCode` places
 * there — never a second lookup table.
 *
 * Both vocabulary strands (Vocab_A2, Vocab_B1) land on Vocabulary and this
 * payload carries no server-owned blend, so the cell shows the LIMITING strand:
 * the lowest-ranked BANDED status, i.e. the one holding the student back. A
 * banded status always wins over an absence, and nothing is averaged, cut or
 * invented — the status rendered is one the wire carried, verbatim. An area no
 * attribute of the row reaches (Critical reading, which no model attribute
 * feeds; a listening row's L1..L7) resolves to null — the honest em dash.
 */
export function masteryAreaAttribute(
  row: DiagnosticMasteryRow,
  area: string,
): DiagnosticAttribute | null {
  let best: DiagnosticAttribute | null = null;
  let bestRank: number | null = null;
  for (const attribute of row.attributes) {
    if (diagnosticAreaCode(attribute.code) !== area) continue;
    const rank = STATUS_RANK[attribute.status];
    if (best === null || (rank !== null && (bestRank === null || rank < bestRank))) {
      best = attribute;
      bestRank = rank;
    }
  }
  return best;
}

function attributeRank(row: DiagnosticMasteryRow, code: string): number | null {
  const attribute = masteryAreaAttribute(row, code);
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
