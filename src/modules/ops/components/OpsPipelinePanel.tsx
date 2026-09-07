'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { PipelineQueueHealth } from '@schooltest/ops-contracts';

import { Badge, Button, Card } from '@/modules/design-system';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { usePipelineHealthQuery } from '@/modules/ops/queries/use-pipeline-health.query';
import { usePipelineQueueDrainMutation } from '@/modules/ops/queries/use-pipeline-queue-drain.mutation';
import { usePipelineQueuePauseMutation } from '@/modules/ops/queries/use-pipeline-queue-pause.mutation';
import { usePipelineRetryMutation } from '@/modules/ops/queries/use-pipeline-retry.mutation';

/**
 * Ledger row 5d (D-005) — the scoring-pipeline panel: queue health from the
 * server's own BullMQ counts, the R probe beside them, and the three controls
 * (retry one failed job, pause/resume a queue, drain FAILED jobs).
 *
 * These queues are SHARED with the live workers — every control is therefore
 * gated behind a destructive confirmation that names the queue and, for drain,
 * previews the failed depth it is about to delete. The panel renders real
 * counts; it never implies a queue is paused unless the server said so.
 */

type ConfirmTarget =
  | { kind: 'pause'; queue: string; paused: boolean }
  | { kind: 'drain'; queue: string; failed: number }
  | { kind: 'retry'; queue: string; job_id: string }
  | null;

export function OpsPipelinePanel() {
  const t = useTranslations('Ops.system.pipeline');
  const query = usePipelineHealthQuery();
  const pause = usePipelineQueuePauseMutation();
  const drain = usePipelineQueueDrainMutation();
  const retry = usePipelineRetryMutation();

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [retryQueue, setRetryQueue] = useState('');
  const [retryJobId, setRetryJobId] = useState('');
  // The health payload does not carry paused state; the pause mutation's
  // server answer is the authority, recorded per queue as it arrives.
  const [pausedByQueue, setPausedByQueue] = useState<Record<string, boolean>>({});

  const busy = pause.isPending || drain.isPending || retry.isPending;

  const onConfirm = () => {
    if (!confirmTarget) return;
    if (confirmTarget.kind === 'pause') {
      pause.mutate(
        { name: confirmTarget.queue, paused: confirmTarget.paused },
        {
          onSuccess: (row) =>
            setPausedByQueue((prev) => ({ ...prev, [row.queue]: row.paused })),
          onSettled: () => setConfirmTarget(null),
        },
      );
      return;
    }
    if (confirmTarget.kind === 'drain') {
      drain.mutate(confirmTarget.queue, { onSettled: () => setConfirmTarget(null) });
      return;
    }
    retry.mutate(
      { queue: confirmTarget.queue, job_id: confirmTarget.job_id },
      { onSettled: () => setConfirmTarget(null) },
    );
  };

  return (
    <div data-slot="ops-pipeline-panel" className="flex flex-col gap-4">
      {query.isError ? (
        <p
          data-slot="pipeline-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {t('error')}
        </p>
      ) : null}
      {query.isPending ? (
        <p data-state="loading" role="status" aria-live="polite" className="text-sm text-body">
          {t('loading')}
        </p>
      ) : null}

      {query.data ? (
        <>
          <div className="flex items-center gap-3">
            <Badge variant={query.data.r_scoring === 'up' ? 'success' : 'error'}>
              {t('rScoring', { status: query.data.r_scoring })}
            </Badge>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table data-slot="pipeline-queue-table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.queue')}</TableHead>
                  <TableHead>{t('columns.waiting')}</TableHead>
                  <TableHead>{t('columns.active')}</TableHead>
                  <TableHead>{t('columns.failed')}</TableHead>
                  <TableHead>{t('columns.completed')}</TableHead>
                  <TableHead>{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.queues.map((row: PipelineQueueHealth) => {
                  const paused = pausedByQueue[row.name] === true;
                  return (
                    <TableRow key={row.name} data-slot="pipeline-queue-row" data-queue={row.name}>
                      <TableCell className="font-mono text-xs">{row.name}</TableCell>
                      <TableCell className="text-xs">{row.waiting}</TableCell>
                      <TableCell className="text-xs">{row.active}</TableCell>
                      <TableCell className="text-xs">{row.failed}</TableCell>
                      <TableCell className="text-xs">{row.completed}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            data-slot={`pipeline-pause-${row.name}`}
                            onClick={() =>
                              setConfirmTarget({
                                kind: 'pause',
                                queue: row.name,
                                paused: !paused,
                              })
                            }
                          >
                            {paused ? t('resume') : t('pause')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy || row.failed === 0}
                            data-slot={`pipeline-drain-${row.name}`}
                            onClick={() =>
                              setConfirmTarget({ kind: 'drain', queue: row.name, failed: row.failed })
                            }
                          >
                            {t('drain')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <p className="text-xs text-body">{t('retry.description')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                data-slot="pipeline-retry-queue"
                value={retryQueue}
                onChange={(event) => setRetryQueue(event.target.value)}
                aria-label={t('retry.queueLabel')}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="">{t('retry.queuePlaceholder')}</option>
                {(query.data.queues ?? []).map((row) => (
                  <option key={row.name} value={row.name}>
                    {row.name}
                  </option>
                ))}
              </select>
              <input
                data-slot="pipeline-retry-job-id"
                value={retryJobId}
                onChange={(event) => setRetryJobId(event.target.value)}
                placeholder={t('retry.jobPlaceholder')}
                aria-label={t('retry.jobLabel')}
                className="min-w-56 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || retryQueue === '' || retryJobId.trim() === ''}
                data-slot="pipeline-retry-submit"
                onClick={() => setConfirmTarget({ kind: 'retry', queue: retryQueue, job_id: retryJobId.trim() })}
              >
                {t('retry.action')}
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <OpsConfirmDialog
        open={confirmTarget?.kind === 'pause'}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={t('pauseConfirm.title')}
        description={t('pauseConfirm.body', {
          queue: confirmTarget?.kind === 'pause' ? confirmTarget.queue : '',
          action: confirmTarget?.kind === 'pause' && confirmTarget.paused ? t('pauseWord') : t('resumeWord'),
        })}
        confirmLabel={t('pauseConfirm.action')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={pause.isPending}
        onConfirm={onConfirm}
      />
      <OpsConfirmDialog
        open={confirmTarget?.kind === 'drain'}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={t('drainConfirm.title')}
        description={t('drainConfirm.body', {
          queue: confirmTarget?.kind === 'drain' ? confirmTarget.queue : '',
          count: confirmTarget?.kind === 'drain' ? confirmTarget.failed : 0,
        })}
        confirmLabel={t('drainConfirm.action')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={drain.isPending}
        onConfirm={onConfirm}
      />
      <OpsConfirmDialog
        open={confirmTarget?.kind === 'retry'}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={t('retryConfirm.title')}
        description={t('retryConfirm.body', {
          queue: confirmTarget?.kind === 'retry' ? confirmTarget.queue : '',
          jobId: confirmTarget?.kind === 'retry' ? confirmTarget.job_id : '',
        })}
        confirmLabel={t('retryConfirm.action')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={retry.isPending}
        onConfirm={onConfirm}
      />
    </div>
  );
}
