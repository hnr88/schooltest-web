'use client';

import type { DirectoryQueryStatus } from '@/modules/directory';

import { derivePastSessionsStatus } from '@/modules/teacher/lib/past-sessions';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type { PastSessionsStatus } from '@/modules/teacher/types/past-sessions.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

interface PastSessionsState {
  status: PastSessionsStatus;
  sessions: readonly TeacherTestSession[];
  tests: readonly TeacherTest[];
  sessionCount: number;
  /** ops/34 — the two reads composed into the ONE status the kit's states render from. */
  queryStatus: DirectoryQueryStatus;
}

/**
 * The history panel's brain. TWO live reads and no third source of truth:
 * C-TS-2 (`GET /api/teacher/test-sessions`, already `opened_at:desc` and already
 * scoped to `caller`) for the rows, and C-TD-2 (`GET /api/teacher/tests`) for
 * each variant's display label — the same label the join-code panel shows, so a
 * server-side rename lands in both at once.
 *
 * Both reads must succeed before a row renders: a failed test read would leave
 * every Test cell blank, which reads as "this session had no test" rather than
 * "the portal could not load the names". ops/34 composes that same rule into
 * ONE `DirectoryQueryStatus` — either read pending is loading, either failed is
 * the error arm, retry re-runs both — so the kit renders the states the panel
 * used to hand-roll.
 */
export function usePastSessions(): PastSessionsState {
  const sessions = useTestSessionsQuery();
  const tests = useTeacherTestsQuery();
  const rows = sessions.data?.sessions ?? [];

  return {
    status: derivePastSessionsStatus({
      isLoading: sessions.isLoading || tests.isLoading,
      isError: sessions.isError || tests.isError,
      isSuccess: sessions.isSuccess && tests.isSuccess,
      sessionCount: rows.length,
    }),
    sessions: rows,
    tests: tests.data?.tests ?? [],
    sessionCount: rows.length,
    queryStatus: {
      isPending: sessions.isPending || tests.isPending,
      isError: sessions.isError || tests.isError,
      isFetching: sessions.isFetching || tests.isFetching,
      error: sessions.error ?? tests.error,
      refetch: () => {
        void sessions.refetch();
        void tests.refetch();
      },
    },
  };
}
