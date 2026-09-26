import type { ResultView } from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import { resultViewsOf, topGains, type RosterRow } from '@/modules/results';

import { dotMapOf, maxSittings } from '@/modules/teacher/lib/v2/progress/dot-map';
import { subMapsOf } from '@/modules/teacher/lib/v2/progress/sub-map';
import { growthFromServer } from '@/modules/teacher/lib/v2/growth';
import type { ClassProgressView, ProgressMover } from '@/modules/teacher/types/v2-class-tabs.types';

const GAINS_SIZE = 4;

function moversFrom(roster: readonly RosterRow[], ranked: readonly ResultView[], size: number): ProgressMover[] {
  const rowsByResult = new Map(
    roster.flatMap((row) => (row.result === null ? [] : [[row.result.document_id, row] as const])),
  );
  return ranked.slice(0, size).flatMap((result) => {
    const row = rowsByResult.get(result.document_id);
    if (row === undefined) return [];
    return [
      {
        studentDocumentId: row.student.document_id,
        name: row.student.name,
        firstName: getStudentFirstName(row.student.name),
        score: result.overall.domain_score,
        growth: growthFromServer(result.overall),
      },
    ];
  });
}

/** Reliable deltas ascending, never repeating a "Highest" student (celebrated and flagged at once). */
function lowestGains(results: readonly ResultView[], highest: readonly ResultView[]): ResultView[] {
  const shown = new Set(highest.map((result) => result.document_id));
  return results
    .filter((result) => result.overall.delta_reliable === true && result.overall.delta !== null)
    .filter((result) => !shown.has(result.document_id))
    .sort((a, b) => (a.overall.delta as number) - (b.overall.delta as number))
    .slice(0, GAINS_SIZE);
}

export function classProgress(roster: readonly RosterRow[]): ClassProgressView {
  const results = resultViewsOf(roster);
  const highest = topGains(results).slice(0, GAINS_SIZE);
  return {
    sittings: maxSittings(results),
    dotMap: dotMapOf(roster),
    subMap: subMapsOf(roster),
    gainTop: moversFrom(roster, highest, GAINS_SIZE),
    gainLow: moversFrom(roster, lowestGains(results, highest), GAINS_SIZE),
  };
}
