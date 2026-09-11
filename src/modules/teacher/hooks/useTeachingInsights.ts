'use client';

import { resultViewsOf, type RosterRow } from '@/modules/results';
import { latestReadingSitting } from '@/modules/teacher/lib/v2/latest-sitting';
import { rosterGroups } from '@/modules/teacher/lib/v2/roster-groups';
import { teachingInsights } from '@/modules/teacher/lib/v2/teaching-insights';
import { useClassSittingsQuery } from '@/modules/test-day';
import type { TeachingInsightsState } from '@/modules/teacher/types/class-analytics.types';

// The Teaching insights view model, from reads that answer for every class a teacher can
// open: the roster the class-detail frame read and the class's sittings (the Live tab's
// list). The Last sitting form is the latest reading sitting's; suggested groups come from
// the roster. The class diagnostic is not read here — its teacher scope (the class's
// `teachers`) is narrower than the dashboard's, so it 403s on classes the teacher can open.
export function useTeachingInsights(classDocumentId: string, rows: readonly RosterRow[]): TeachingInsightsState {
  const sittings = useClassSittingsQuery(classDocumentId);
  const latest = latestReadingSitting(sittings.data ?? []);
  const view = teachingInsights(rows, { form_code: latest?.form?.form_code ?? null, groups: [] });
  return {
    view: { ...view, groups: rosterGroups(rows) },
    hasResults: resultViewsOf(rows).length > 0,
    latestSittingId: latest?.documentId ?? null,
  };
}
