'use client';

import type { ResultView } from '@schooltest/scoring-contracts';

import { ConfidenceStrip } from './ConfidenceStrip';
import { ProgressTrendChart } from './ProgressTrendChart';
import { StudentResultHeader, type StudentIdentity } from './StudentResultHeader';
import { SubskillCardGrid } from './SubskillCardGrid';

/**
 * Screen C part 1 (dashboard §4.1–§4.4): header, confidence strip, trend
 * chart, seven cards. A PURE composition over a parsed ResultView — the
 * fetching is `useStudentResultQuery` (task 29) at wiring time; this component
 * takes the already-parsed view so tests render the REAL fixture payload
 * without a server.
 *
 * §6 states handled here: scoring failed (a full-panel failure, never score
 * cards built from a result the pipeline itself rejected), first sitting and
 * skill-not-assessed (inside the chart/cards), Section 3 not reached
 * (gate.passed null), low confidence and single strand (their own components).
 */
export function StudentResultScreen({ view, student }: { view: ResultView; student: StudentIdentity }) {
  if (view.status === 'scoring_failed') {
    return (
      <div data-slot="result-screen" data-state="scoring_failed" className="flex flex-col gap-2 p-4">
        <p data-slot="scoring-failed" className="text-body font-semibold text-danger-ink">
          Scoring failed for this sitting — the result is not available. Nothing is shown rather than a partial
          report; the sitting will be re-scored.
        </p>
      </div>
    );
  }

  return (
    <div data-slot="result-screen" data-status={view.status} className="flex flex-col gap-4 p-4">
      <StudentResultHeader view={view} student={student} />
      <ConfidenceStrip view={view} />
      <ProgressTrendChart view={view} />
      <SubskillCardGrid view={view} />
    </div>
  );
}
