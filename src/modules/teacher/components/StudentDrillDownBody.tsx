'use client';

import { CollapsedTestSummary } from '@/modules/teacher/components/CollapsedTestSummary';
import { StudentComparisonStrip } from '@/modules/teacher/components/StudentComparisonStrip';
import { StudentTestCard } from '@/modules/teacher/components/StudentTestCard';
import { TestNotCompletedCard } from '@/modules/teacher/components/TestNotCompletedCard';
import { drillDownTests } from '@/modules/teacher/lib/student-drill-down';
import type { StudentDrillDownBodyProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Student drill-down, both variants of it, from ONE C-TR-2 read:
//
//   comparison strip (both tests, comparable)
//   → the MOST RECENT test in full, its tiles carrying "was 62% ↑16"
//   → every older test collapsed to a summary row of coloured pills
//   → a "Test <v> — not yet completed" card for each variant the response lacks
//
// The order is the server's: `tests` arrives most-recent-first, `drillDownTests`
// splits it at index 0, and no variant letter is compared anywhere. With a single
// test the strip is absent (C-TR-2 sends `progress: null`), nothing collapses, the
// tiles carry no deltas because `previous_likelihood`/`delta` are `null`, and the
// missing variant shows its placeholder — the same code path, driven only by what
// the response holds.
//
// `progress: null` alongside TWO tests is the F-EQUATING-GATE outcome (an A/B pair
// the platform may not compare): the strip stays away and the older test still
// collapses on recency. No difference is computed to fill the gap.
function StudentDrillDownBody({ data }: StudentDrillDownBodyProps) {
  const view = drillDownTests(data.tests);
  if (!view) return null;

  const [earlier] = view.earlier;

  return (
    <>
      {data.progress && earlier ? (
        <StudentComparisonStrip progress={data.progress} earlier={earlier} latest={view.latest} />
      ) : null}

      <StudentTestCard test={view.latest} bands={data.bands} />

      {view.earlier.map((test) => (
        <CollapsedTestSummary key={test.variant} test={test} />
      ))}

      {view.missing.map((variant) => (
        <TestNotCompletedCard key={variant} variant={variant} />
      ))}
    </>
  );
}

export { StudentDrillDownBody };
