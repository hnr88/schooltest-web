'use client';

import { useEffect } from 'react';

import { HISTORY_PAGE_SIZE } from '@/modules/teacher/constants/live-tab.constants';
import { historyIsTruncated, historyRows, selectLiveSitting } from '@/modules/teacher/lib/live-tab';
import { isBooking, toBooking } from '@/modules/teacher/lib/live-rollup';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTestSessionMonitorQuery } from '@/modules/teacher/queries/use-test-session-monitor.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type { LiveTabState } from '@/modules/teacher/types/live-tab.types';

/**
 * The Live tab's reads: the class's live sittings, bookings and one page of closed
 * sittings (C-TS-2), the class card (C-TD-1) and the selected sitting's monitor
 * (C-TS-3, polled while open). The sitting is `?session=` when it is live, else the
 * first live one; a booking is never live. When the monitor reports the sitting
 * closed, the live list is read again so the tab falls back to "No sitting open".
 */
export function useLiveTab(classDocumentId: string, sessionId: string | null): LiveTabState {
  const open = useTestSessionsQuery(true, { status: 'open', class: classDocumentId });
  const booked = useTestSessionsQuery(true, { status: 'scheduled', class: classDocumentId });
  const closed = useTestSessionsQuery(true, {
    status: 'closed',
    class: classDocumentId,
    page: 1,
    pageSize: HISTORY_PAGE_SIZE,
  });
  const dashboard = useTeacherDashboardQuery();
  const openRows = open.data?.sessions ?? [];
  const selected = selectLiveSitting(openRows, sessionId);
  const monitor = useTestSessionMonitorQuery(selected?.sitting_document_id ?? '', selected !== null);
  const monitorClosed = monitor.data?.sitting.status === 'closed';
  const refetchOpen = open.refetch;

  useEffect(() => {
    if (monitorClosed) void refetchOpen();
  }, [monitorClosed, refetchOpen]);

  const card = dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId);
  const closedRows = closed.data?.sessions ?? [];
  const sitting = monitorClosed ? null : selected;

  return {
    status: open.isError || dashboard.isError ? 'error' : open.isPending || dashboard.isPending ? 'loading' : 'ready',
    retry: () => {
      void open.refetch();
      void dashboard.refetch();
    },
    klass:
      card === undefined
        ? null
        : { name: card.name, studentCount: card.student_count, yearLevel: card.year_level ?? null },
    sitting,
    settings: sitting?.settings ?? null,
    monitor: sitting === null ? null : (monitor.data ?? null),
    bookings: (booked.data?.sessions ?? []).filter(isBooking).map(toBooking),
    history: historyRows(openRows, closedRows),
    historyTruncated: historyIsTruncated(closedRows, closed.data?.meta?.pagination.total ?? closedRows.length),
    historyError: closed.isError,
  };
}
