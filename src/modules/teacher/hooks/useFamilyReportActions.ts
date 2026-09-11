'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import {
  resultRecallBodySchema,
  useRecallResultMutation,
  useReleaseHeldResultsMutation,
  useReleaseResultMutation,
  type RosterRow,
} from '@/modules/results';
import { failureReasonKey, releaseBatchSummary } from '@/modules/teacher/lib/family-report-feedback';
import { familyReportRow } from '@/modules/teacher/lib/v2/family-reports';
import type {
  FamilyConfirm,
  FamilyReportActions,
  FamilyReportRow,
  ReleaseBatchSummary,
} from '@/modules/teacher/types/v2-family.types';

export function useFamilyReportActions(
  roster: readonly RosterRow[],
  releasableResultIds: readonly string[],
): FamilyReportActions {
  const t = useTranslations('TeacherPortal.familyReports');
  const format = useFormatter();
  const release = useReleaseResultMutation();
  const recall = useRecallResultMutation();
  const releaseAll = useReleaseHeldResultsMutation();
  const [confirm, setConfirm] = useState<FamilyConfirm | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pending = release.isPending || recall.isPending || releaseAll.isPending;

  const open = (next: FamilyConfirm): void => {
    setError(null);
    setReason('');
    setConfirm(next);
  };
  const done = (tone: ReleaseBatchSummary['tone'], message: string): void => {
    showOpsToast({ tone, message });
    setConfirm(null);
  };
  const summaryMessage = (summary: ReleaseBatchSummary): string => {
    const head =
      summary.failures.length === 0
        ? t('toast.releasedAll', { count: summary.released })
        : summary.released === 0
          ? t('toast.releasedNone')
          : t('toast.releasedSome', { released: summary.released, total: summary.total });
    const tail = summary.failures.map((group) =>
      t('toast.notReleased', { reason: t(group.reasonKey), names: format.list(group.names, { type: 'conjunction' }) }),
    );
    return [head, ...tail].join(' ');
  };

  const runRelease = (row: FamilyReportRow): void => {
    if (row.resultDocumentId === null) return;
    release.mutate(row.resultDocumentId, {
      onSuccess: () => done('ok', t('toast.released', { name: row.name })),
      onError: (cause) => setError(t('failedRelease', { name: row.name, reason: t(failureReasonKey(cause)) })),
    });
  };
  const runRecall = (row: FamilyReportRow): void => {
    const body = resultRecallBodySchema.safeParse({ recall_reason: reason.trim() });
    if (!body.success) {
      setError(t('recall.reasonRequired'));
      return;
    }
    if (row.resultDocumentId === null) return;
    recall.mutate(
      { resultDocumentId: row.resultDocumentId, recallReason: body.data.recall_reason },
      {
        onSuccess: () => done('warn', t('toast.recalled', { name: row.name })),
        onError: (cause) => setError(t('failedRecall', { name: row.name, reason: t(failureReasonKey(cause)) })),
      },
    );
  };
  const runReleaseAll = (): void => {
    releaseAll.mutate(releasableResultIds, {
      onSuccess: (outcome) => {
        const summary = releaseBatchSummary(outcome, roster.map(familyReportRow));
        done(summary.tone, summaryMessage(summary));
      },
    });
  };

  return {
    confirm,
    reason,
    error,
    pending,
    setReason: (next) => {
      setReason(next);
      setError(null);
    },
    askRelease: (row) => open({ kind: 'release', row }),
    askRecall: (row) => open({ kind: 'recall', row }),
    askReleaseAll: () => open(releasableResultIds.length === 0 ? { kind: 'nothingHeld' } : { kind: 'releaseAll' }),
    close: () => {
      if (!pending) setConfirm(null);
    },
    run: () => {
      if (confirm === null || pending) return;
      if (confirm.kind === 'release') runRelease(confirm.row);
      else if (confirm.kind === 'recall') runRecall(confirm.row);
      else if (confirm.kind === 'releaseAll') runReleaseAll();
      else setConfirm(null);
    },
  };
}
