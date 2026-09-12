'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { classResultsQueryOptions } from '@/modules/results';
import { useLogIncidentMutation, useMarkAbsentMutation, useStudentControlMutation } from '@/modules/test-day';
import { LIVE_EXTEND_MINUTES } from '@/modules/teacher/constants/live-students.constants';
import { incidentNote } from '@/modules/teacher/lib/live-student-actions';
import { useRescoreResultMutation } from '@/modules/teacher/queries/use-rescore-result.mutation';
import { testSessionMonitorQueryOptions } from '@/modules/teacher/queries/use-test-session-monitor.query';
import type { LiveRowActionKey, LiveStudentRow } from '@/modules/teacher/types/live-students.types';

/**
 * One row action as ONE real write: C-SIT-06 absent, B2's per-student controls,
 * the activity append (Log an incident) or the rescore modes. `refresh` then
 * refetches the reads the mutation hooks do not already invalidate.
 */
export function useLiveStudentCommands(options: {
  sittingId: string;
  classDocumentId: string;
  rememberResult: (studentId: string, resultId: string) => void;
}) {
  const { sittingId, classDocumentId, rememberResult } = options;
  const t = useTranslations('TeacherPortal.live.students');
  const queryClient = useQueryClient();
  const control = useStudentControlMutation();
  const absent = useMarkAbsentMutation();
  const incident = useLogIncidentMutation(sittingId);
  const rescore = useRescoreResultMutation();
  const [retried, setRetried] = useState<ReadonlySet<string>>(() => new Set());

  async function run(key: LiveRowActionKey, row: LiveStudentRow): Promise<void> {
    const target = { sittingDocumentId: sittingId, studentDocumentId: row.studentId };
    const resultId = row.resultId;
    switch (key) {
      case 'markAbsent':
      case 'undoAbsent':
        await absent.mutateAsync({ ...target, absent: key === 'markAbsent' });
        return;
      case 'pause':
      case 'resume':
      case 'relaunch':
        await control.mutateAsync({ ...target, action: key });
        return;
      case 'extend':
        await control.mutateAsync({ ...target, action: 'extend', minutes: LIVE_EXTEND_MINUTES });
        return;
      case 'forceSubmit': {
        const state = await control.mutateAsync({ ...target, action: 'submit' });
        if (state.result_document_id !== null) rememberResult(row.studentId, state.result_document_id);
        return;
      }
      case 'incident':
        await incident.mutateAsync({
          sittingDocumentId: sittingId,
          note: incidentNote(t('incidentNote', { name: row.name })),
          kind: 'warn',
        });
        return;
      case 'retry':
      case 'raiseManual':
      case 'rescore':
        if (resultId === null) return;
        await rescore.mutateAsync({ documentId: resultId, mode: key === 'raiseManual' ? 'manual' : key });
        if (key === 'retry') setRetried((previous) => new Set(previous).add(resultId));
        return;
      case 'review':
        return;
    }
  }

  function refresh(): Promise<unknown> {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: testSessionMonitorQueryOptions(sittingId).queryKey }),
      queryClient.invalidateQueries({ queryKey: classResultsQueryOptions(classDocumentId).queryKey }),
    ]);
  }

  return { run, refresh, retried };
}
