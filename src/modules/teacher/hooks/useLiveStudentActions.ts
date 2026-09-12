'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import {
  LIVE_BATCH_ACTION,
  LIVE_CONFIRMED_ACTIONS,
} from '@/modules/teacher/constants/live-students.constants';
import { useLiveStudentCommands } from '@/modules/teacher/hooks/useLiveStudentCommands';
import { batchPlan, controlErrorOf } from '@/modules/teacher/lib/live-student-actions';
import type {
  LiveBatchKind,
  LiveBatchPlan,
  LiveDialog,
  LiveRowActionKey,
  LiveStudentRow,
} from '@/modules/teacher/types/live-students.types';

interface Failure {
  name: string;
  cause: unknown;
}

/**
 * The row menu and batch bar as real writes: the design's confirm first where it
 * asks (:3380–3500, :4141–4166), then one call per student. A refusal is shown
 * as the server's own reason — in the dialog it came from, or as a toast.
 */
export function useLiveStudentActions(options: {
  sittingId: string;
  classDocumentId: string;
  rows: readonly LiveStudentRow[];
  selected: ReadonlySet<string>;
  rememberResult: (studentId: string, resultId: string) => void;
  clearSelection: () => void;
}) {
  const { rows, selected, clearSelection } = options;
  const t = useTranslations('TeacherPortal.live.students');
  const commands = useLiveStudentCommands(options);
  const [dialog, setDialog] = useState<LiveDialog | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<LiveStudentRow | null>(null);

  const failureText = (failure: Failure) =>
    t(`error.${controlErrorOf(failure.cause)}`, { name: failure.name });

  async function perform(key: LiveRowActionKey, row: LiveStudentRow, inDialog: boolean): Promise<void> {
    setPending(true);
    setError(null);
    try {
      await commands.run(key, row);
      await commands.refresh();
      if (key !== 'incident') showOpsToast({ tone: 'ok', message: t(`done.${key}`, { name: row.name }) });
      setDialog(null);
    } catch (cause) {
      const message = failureText({ name: row.name, cause });
      if (inDialog) setError(message);
      else showOpsToast({ tone: 'error', message });
    } finally {
      setPending(false);
    }
  }

  async function runBatch(plan: LiveBatchPlan): Promise<void> {
    setPending(true);
    setError(null);
    // One student at a time: the absent list is a single JSON column on the
    // sitting, so two writes at once would race each other.
    const failures = await plan.eligible.reduce<Promise<Failure[]>>(async (queue, row) => {
      const sofar = await queue;
      try {
        await commands.run(LIVE_BATCH_ACTION[plan.kind], row);
        return sofar;
      } catch (cause) {
        return [...sofar, { name: row.name, cause }];
      }
    }, Promise.resolve([]));
    await commands.refresh();
    setPending(false);
    const total = plan.eligible.length;
    const done = total - failures.length;
    if (failures.length === 0) {
      showOpsToast({ tone: 'ok', message: t(`batch.${plan.kind}.done`, { students: t('batch.students', { count: done }) }) });
    } else {
      showOpsToast({
        tone: done === 0 ? 'error' : 'warn',
        message: [t('batch.partial', { done, total }), ...failures.map(failureText)].join(' '),
      });
    }
    clearSelection();
    setDialog(null);
  }

  return {
    dialog,
    pending,
    error,
    review,
    retried: commands.retried,
    closeReview: () => setReview(null),
    chooseRow: (key: LiveRowActionKey, row: LiveStudentRow) => {
      if (key === 'review') {
        setReview(row);
        return;
      }
      if (LIVE_CONFIRMED_ACTIONS.has(key)) {
        setError(null);
        setDialog({ type: 'row', key, row });
        return;
      }
      void perform(key, row, false);
    },
    chooseBatch: (kind: LiveBatchKind) => {
      const plan = batchPlan(kind, rows, selected);
      setError(null);
      setDialog(
        plan.eligible.length === 0
          ? { type: 'nothing', kind, selectedCount: plan.selectedCount }
          : { type: 'batch', plan },
      );
    },
    confirm: () => {
      if (dialog === null) return;
      if (dialog.type === 'row') void perform(dialog.key, dialog.row, true);
      else if (dialog.type === 'batch') void runBatch(dialog.plan);
      else setDialog(null);
    },
    close: () => {
      if (pending) return;
      setDialog(null);
      setError(null);
    },
  };
}
