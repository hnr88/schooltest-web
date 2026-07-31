'use client';

import { useQueries } from '@tanstack/react-query';

import type { SchoolClass } from '@/modules/classes';
import { classDiagnosticQueryOptions, type DiagnosticStatus } from '@/modules/teach';

export interface AreaAggregate {
  code: string;
  mastered: number;
  emerging: number;
  not_mastered: number;
  not_assessed: number;
}

export interface SchoolAggregate {
  rosterTotal: number;
  satTotal: number;
  areas: AreaAggregate[];
  isPending: boolean;
  isError: boolean;
}

// School-level analytics aggregate (task 78, mvp spec 4.3 level 1): the same
// C-RPT-01 per-class diagnostic payloads the teacher dashboard renders,
// combined into one school view - sat totals plus the per-area status
// distribution across every rostered student. No re-derivation: statuses are
// counted verbatim from the wire rows.
export function useSchoolAggregate(classes: SchoolClass[], enabled: boolean): SchoolAggregate {
  const queries = useQueries({
    queries: classes.map((klass) => ({ ...classDiagnosticQueryOptions(klass.documentId), enabled })),
  });

  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);

  const counts = new Map<string, Record<DiagnosticStatus, number>>();
  const order: string[] = [];
  let rosterTotal = 0;
  let satTotal = 0;
  for (const query of queries) {
    const data = query.data;
    if (!data) continue;
    rosterTotal += data.roster_count;
    satTotal += data.sat_count;
    for (const row of data.mastery) {
      for (const attribute of row.attributes) {
        if (!counts.has(attribute.code)) {
          counts.set(attribute.code, { mastered: 0, emerging: 0, not_mastered: 0, not_assessed: 0 });
          order.push(attribute.code);
        }
        counts.get(attribute.code)![attribute.status] += 1;
      }
    }
  }

  return {
    rosterTotal,
    satTotal,
    areas: order.map((code) => ({ code, ...counts.get(code)! })),
    isPending,
    isError,
  };
}
