'use client';

import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';
import type { StartSessionSourcesStatus } from '@/modules/teacher/types/start-session-modal.types';

/**
 * What the modal needs before its form can exist: the teacher's REAL classes
 * (C-TD-1), the selectable tests (C-TD-2) and, for an edit, the booking itself
 * (the scheduled list, C-TS-2 `status=scheduled`). An emptiness claim is made
 * only after the reads answered; a failed read is an error, never an empty list.
 */
export function useStartSessionSources(isOpen: boolean, editSittingId: string | null) {
  const dashboard = useTeacherDashboardQuery(isOpen);
  const tests = useTeacherTestsQuery(isOpen);
  const isEdit = editSittingId !== null;
  const bookings = useTestSessionsQuery(isOpen && isEdit, { status: 'scheduled' });

  const classes = dashboard.data?.classes ?? [];
  const catalogue = tests.data?.tests ?? [];
  const booking = isEdit
    ? (bookings.data?.sessions.find((row) => row.sitting_document_id === editSittingId) ?? null)
    : null;
  const reads = isEdit ? [dashboard, tests, bookings] : [dashboard, tests];

  // A refetch that fails keeps the data it had: only a read that never answered
  // is an error, so a background failure cannot unmount a half-filled form.
  let status: StartSessionSourcesStatus = 'ready';
  if (reads.some((read) => read.isError && read.data === undefined)) status = 'error';
  else if (reads.some((read) => read.isPending)) status = 'loading';
  else if (classes.length === 0) status = 'noClasses';
  else if (catalogue.length === 0) status = 'noTests';
  else if (isEdit && booking === null) status = 'bookingGone';

  return {
    status,
    classes,
    tests: catalogue,
    booking,
    retry: () => {
      for (const read of reads) void read.refetch();
    },
  };
}
