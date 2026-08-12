'use client';

import { findTestLabel } from '@/modules/teacher/lib/join-code';
import {
  deriveLiveMonitorStatus,
  monitorSummaryItems,
  sessionElapsedMinutes,
  sortMonitorStudents,
} from '@/modules/teacher/lib/live-monitor';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { useTestSessionMonitorQuery } from '@/modules/teacher/queries/use-test-session-monitor.query';
import type { LiveMonitorState } from '@/modules/teacher/types/live-monitor.types';

/**
 * The live grid's brain. C-TS-3 is the ONLY source of every tile state, every
 * counter and the stall threshold itself — the portal derives no state from a
 * clock and re-thresholds nothing, so an amber tile is amber because the server
 * said `stalled`.
 *
 * The second read is C-TD-2 (`GET /api/teacher/tests`), used ONLY for the
 * header's visible test name — the same `label` the join-code panel shows, so a
 * server-side rename lands in both at once. It is deliberately NOT a
 * precondition for the grid: a missing label yields `null` and the header falls
 * back to the class name alone (task 035's own rule) rather than blocking the
 * monitoring view or inventing "Test A".
 *
 * `startedMinutesAgo` is measured against the query's own `dataUpdatedAt` — the
 * moment this payload arrived — not a `Date.now()` read during render. That keeps
 * the render pure (React Compiler's purity rule) AND makes the age honest: it
 * says how old the session was when the server last answered, and it advances
 * only when a poll lands.
 */
export function useLiveMonitor(sittingDocumentId: string): LiveMonitorState {
  const monitor = useTestSessionMonitorQuery(sittingDocumentId);
  const tests = useTeacherTestsQuery();
  const data = monitor.data;

  return {
    status: deriveLiveMonitorStatus({
      isLoading: monitor.isPending,
      isError: monitor.isError,
      isSuccess: monitor.isSuccess,
      hasSitting: Boolean(data?.sitting),
    }),
    sitting: data?.sitting ?? null,
    testLabel: data ? findTestLabel(tests.data?.tests ?? [], data.sitting.variant) : null,
    stallThresholdMinutes: data?.stall_threshold_minutes ?? null,
    summaryItems: data ? monitorSummaryItems(data.summary) : [],
    students: data ? sortMonitorStudents(data.students) : [],
    startedMinutesAgo: data
      ? sessionElapsedMinutes(data.sitting.opened_at, monitor.dataUpdatedAt)
      : null,
    isRefetching: monitor.isFetching,
    retry: () => {
      void monitor.refetch();
      void tests.refetch();
    },
  };
}
