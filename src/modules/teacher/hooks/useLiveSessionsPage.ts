'use client';

import { deriveLiveRollup } from '@/modules/teacher/lib/live-rollup';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type { TeacherTestSessionsQuery } from '@/modules/teacher/schemas/teacher-session.schema';

const OPEN_SITTINGS: TeacherTestSessionsQuery = { status: 'open' };
const BOOKINGS: TeacherTestSessionsQuery = { status: 'scheduled' };

/**
 * The Live sessions page's reads — the teacher's open sittings and bookings
 * (C-TS-2, each row with the server's stats and window) and the class cards
 * (C-TD-1) — and the one roll-up derived from them. The bookings read never
 * blocks the live part of the page; it reports its own state.
 */
export function useLiveSessionsPage() {
  const sessions = useTestSessionsQuery(true, OPEN_SITTINGS);
  const bookings = useTestSessionsQuery(true, BOOKINGS);
  const dashboard = useTeacherDashboardQuery();
  const status: 'loading' | 'error' | 'ready' =
    sessions.isError || dashboard.isError
      ? 'error'
      : sessions.isPending || dashboard.isPending
        ? 'loading'
        : 'ready';
  const rows = [...(sessions.data?.sessions ?? []), ...(bookings.data?.sessions ?? [])];

  return {
    status,
    rollup: deriveLiveRollup(rows, dashboard.data?.classes ?? []),
    isBookingsError: bookings.isError,
    isRetrying: sessions.isFetching || dashboard.isFetching || bookings.isFetching,
    retry: () => {
      void sessions.refetch();
      void dashboard.refetch();
    },
    retryBookings: () => void bookings.refetch(),
  };
}
