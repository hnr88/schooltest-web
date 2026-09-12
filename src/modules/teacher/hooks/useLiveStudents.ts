'use client';

import { useState } from 'react';

import { useClassResultsQuery } from '@/modules/results';
import { useSittingMonitorQuery } from '@/modules/test-day';
import { buildLiveRows } from '@/modules/teacher/lib/live-students';
import { useTestSessionMonitorQuery } from '@/modules/teacher/queries/use-test-session-monitor.query';

const NO_FORCED: ReadonlyMap<string, string> = new Map();

/**
 * The Live tab's student rows from three live reads, each polled or cached by
 * its own hook: the teacher monitor (state, stage, idle minutes, connection),
 * the sitting monitor (full name, email, session) and the class roster (the
 * Result of that session). A force submit's returned Result id is kept here so
 * "Review submission" works before the roster lists the new Result.
 */
export function useLiveStudents(sittingId: string, classDocumentId: string) {
  const monitor = useTestSessionMonitorQuery(sittingId);
  const board = useSittingMonitorQuery(sittingId);
  const roster = useClassResultsQuery(classDocumentId);
  const [forcedResults, setForcedResults] = useState<ReadonlyMap<string, string>>(NO_FORCED);

  const rows = monitor.data
    ? buildLiveRows({
        tiles: monitor.data.students,
        sittingRows: board.data?.students ?? [],
        roster: roster.data ?? [],
        forcedResults,
      })
    : [];

  return {
    rows,
    isPending: monitor.isPending,
    isError: monitor.isError,
    isOpen: monitor.data?.sitting.status === 'open',
    className: monitor.data?.sitting.class.name ?? null,
    rememberResult: (studentId: string, resultId: string) =>
      setForcedResults((previous) => new Map(previous).set(studentId, resultId)),
  };
}
