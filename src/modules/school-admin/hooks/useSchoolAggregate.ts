'use client';

import { useQueries } from '@tanstack/react-query';

import type { SchoolClass } from '@/modules/classes';
import {
  MASTERY_AREA_CODES,
  classDiagnosticQueryOptions,
  diagnosticAreaCode,
  type DiagnosticStatus,
} from '@/modules/teach';

import type { AreaAggregate, SchoolAggregate } from '@/modules/school-admin/types/hooks.types';

// School-level analytics aggregate (task 78, mvp spec 4.3 level 1): the same
// C-RPT-01 per-class diagnostic payloads the teacher dashboard renders,
// combined into one school view - sat totals plus the per-area status
// distribution across every rostered student. Statuses are counted verbatim
// from the wire rows; each cell lands on its reading area (a scored student's
// attribute names and an unscored student's area codes both map onto the
// seven teach areas, the two vocabulary strands onto Vocabulary).
export function useSchoolAggregate(classes: SchoolClass[], enabled: boolean): SchoolAggregate {
  const queries = useQueries({
    queries: classes.map((klass) => ({ ...classDiagnosticQueryOptions(klass.documentId), enabled })),
  });

  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);

  const counts = new Map<string, Record<DiagnosticStatus, number>>();
  let rosterTotal = 0;
  let satTotal = 0;
  for (const query of queries) {
    const data = query.data;
    if (!data) continue;
    rosterTotal += data.roster_count;
    satTotal += data.sat_count;
    for (const row of data.mastery) {
      for (const attribute of row.attributes) {
        const area = diagnosticAreaCode(attribute.code);
        if (area === null) continue;
        if (!counts.has(area)) {
          counts.set(area, { mastered: 0, emerging: 0, not_mastered: 0, not_assessed: 0, secure: 0, developing: 0, not_yet: 0 });
        }
        counts.get(area)![attribute.status] += 1;
      }
    }
  }

  return {
    rosterTotal,
    satTotal,
    areas: MASTERY_AREA_CODES.filter((code) => counts.has(code)).map((code): AreaAggregate => ({ code, ...counts.get(code)! })),
    isPending,
    isError,
  };
}
