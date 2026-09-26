'use client';

import type { RosterRow } from '@/modules/results';
import { teachingPlan } from '@/modules/teacher/lib/v2/teaching/view';
import type { TeachingPlanState } from '@/modules/teacher/types/v2-insights.types';

// Roster-only: the Teaching tab derives everything from the class-detail frame's one
// roster read. It must never read the sittings list (no week concept — Spec 04 §0.1)
// or the class diagnostic, whose teacher scope 403s on classes a teacher can open
// (hook.test.ts trips if either read sneaks back in).
export function useTeachingInsights(rows: readonly RosterRow[]): TeachingPlanState {
  const view = teachingPlan(rows);
  return { view, hasResults: view.counts.students > 0 };
}
