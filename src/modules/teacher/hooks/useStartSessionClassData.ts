'use client';

import { useQueries } from '@tanstack/react-query';

import { useClassResultsQuery } from '@/modules/results';
import { LAST_SESSION_PAGE_SIZE } from '@/modules/teacher/constants/start-session.constants';
import { toRosterStudents } from '@/modules/teacher/lib/start-session-members';
import { browserTimeZone } from '@/modules/teacher/lib/start-session-schedule';
import { lastSessionAt } from '@/modules/teacher/lib/start-session-view';
import { sittingsNeedingMonitor } from '@/modules/teacher/lib/student-availability';
import { testSessionMonitorQueryOptions } from '@/modules/teacher/queries/use-test-session-monitor.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';

/**
 * Everything the modal reads about ONE class, all live: its roster, its open
 * sittings (plus the monitor of each whole-class one, which alone knows who is
 * mid-test), its bookings when a window is being chosen, and its newest closed
 * sitting. The school zone is the one the server echoed on a booking, else the
 * browser's.
 */
export function useStartSessionClassData(classId: string, mode: StartSessionMode, isEdit: boolean) {
  const enabled = Boolean(classId);
  const roster = useClassResultsQuery(classId, enabled);
  const open = useTestSessionsQuery(enabled, { status: 'open', class: classId });
  const closed = useTestSessionsQuery(enabled, {
    status: 'closed',
    class: classId,
    page: 1,
    pageSize: LAST_SESSION_PAGE_SIZE,
  });
  const needsBookings = enabled && (mode === 'later' || isEdit);
  const bookings = useTestSessionsQuery(needsBookings, { status: 'scheduled', class: classId });

  const openSittings = open.data?.sessions ?? [];
  const wholeClassIds = sittingsNeedingMonitor(openSittings);
  const monitorReads = useQueries({
    queries: wholeClassIds.map((id) => ({ ...testSessionMonitorQueryOptions(id), enabled })),
  });
  const monitors = Object.fromEntries(wholeClassIds.map((id, index) => [id, monitorReads[index]?.data]));
  const bookingRows = needsBookings ? (bookings.data?.sessions ?? []) : [];
  const busyReads = [open, ...monitorReads, ...(needsBookings ? [bookings] : [])];

  return {
    roster: toRosterStudents(roster.data ?? []),
    rosterPending: roster.isPending,
    rosterError: roster.isError,
    openSittings,
    monitors,
    bookings: bookingRows,
    busyPending: busyReads.some((read) => read.isPending),
    busyError: busyReads.some((read) => read.isError),
    lastSessionAt: lastSessionAt(closed.data?.sessions ?? []),
    lastSessionPending: closed.isPending,
    timeZone: bookingRows.find((row) => row.window)?.window?.timezone ?? browserTimeZone(),
    retry: () => {
      for (const read of [roster, closed, ...busyReads]) void read.refetch();
    },
  };
}
