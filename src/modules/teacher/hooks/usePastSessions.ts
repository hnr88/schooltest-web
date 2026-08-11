'use client';

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
  retry: () => void;
}

/**
 * The history panel's brain. TWO live reads and no third source of truth:
 * C-TS-2 (`GET /api/teacher/test-sessions`, already `opened_at:desc` and already
 * scoped to `class.teacher = caller`) for the rows, and C-TD-2
 * (`GET /api/teacher/tests`) for each variant's display label — the same label
 * the join-code panel shows, so a server-side rename lands in both at once.
 *
 * Both reads must succeed before a row renders: a failed test read would leave
 * every Test cell blank, which reads as "this session had no test" rather than
 * "the portal could not load the names". So the panel reports the failure and
 * offers a retry instead. Both queries are already in the cache from the setup
 * panel above, so this costs no extra request.
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
    retry: () => {
      void sessions.refetch();
      void tests.refetch();
    },
  };
}
