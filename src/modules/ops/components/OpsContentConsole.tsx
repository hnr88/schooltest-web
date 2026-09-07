'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import type { OrphanKindReport } from '@schooltest/ops-contracts';
import { ORPHAN_KINDS } from '@schooltest/ops-contracts';

import { Alert, Badge, Button, Card } from '@/modules/design-system';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { useContentCountsQuery } from '@/modules/ops/queries/use-content-counts.query';
import { useContentOrphansQuery } from '@/modules/ops/queries/use-content-orphans.query';
import { useContentReindexMutation } from '@/modules/ops/queries/use-content-reindex.mutation';
import { useMediaPruneMutation } from '@/modules/ops/queries/use-media-prune.mutation';
import { useMediaStatsQuery } from '@/modules/ops/queries/use-media-stats.query';
import { useOrphanPurgeMutation } from '@/modules/ops/queries/use-orphan-purge.mutation';

/**
 * Ledger row 8 — the ops Content console (C-OPSC-01..06).
 *
 * Reads (counts, media stats, orphans) render live server data; the three
 * maintenance actions honour the server's dry-run-first contract — reindex
 * and prune EXECUTE only on an explicit `{"dryRun":false}` behind their
 * confirm dialogs, and purge always sends an explicit kinds list. Every
 * result line shows what the server actually returned, including the
 * dryRun flag it executed.
 */

type MaintenanceResult = { outcome: 'success' | 'error'; message: string };

function serverMessage(error: unknown): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (error instanceof Error ? error.message : String(error))
  );
}

function ResultLine({ slot, result }: { slot: string; result: MaintenanceResult | undefined }) {
  const t = useTranslations('Ops.content');
  if (!result) return null;
  return (
    <p
      data-slot={slot}
      data-outcome={result.outcome}
      role="status"
      className={
        result.outcome === 'success'
          ? 'rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
          : 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
      }
    >
      {result.outcome === 'success' ? '✓ ' : '✕ '}
      {result.message}
    </p>
  );
}

function CountsSection() {
  const t = useTranslations('Ops.content.counts');
  const tCommon = useTranslations('Common');
  const query = useContentCountsQuery();

  if (query.isError) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            {tCommon('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }
  if (query.isPending || !query.data) {
    return (
      <div data-state="loading" role="status" aria-live="polite" className="text-sm text-body">
        {tCommon('loading')}
      </div>
    );
  }
  return (
    <div data-slot="content-counts" className="max-h-72 overflow-y-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columns.contentType')}</TableHead>
            <TableHead>{t('columns.uid')}</TableHead>
            <TableHead>{t('columns.rows')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.map((row) => (
            <TableRow key={row.uid}>
              <TableCell className="text-sm">{row.displayName}</TableCell>
              <TableCell className="font-mono text-xs">{row.uid}</TableCell>
              <TableCell className="text-sm">{row.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MediaStatsSection() {
  const t = useTranslations('Ops.content.media');
  const tCommon = useTranslations('Common');
  const query = useMediaStatsQuery();

  if (query.isError) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            {tCommon('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }
  if (query.isPending || !query.data) {
    return (
      <div data-state="loading" role="status" aria-live="polite" className="text-sm text-body">
        {tCommon('loading')}
      </div>
    );
  }
  const stats = query.data;
  return (
    <div data-slot="content-media-stats" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('files')}</p>
          <p className="text-lg font-semibold text-foreground">{stats.files}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('totalBytes')}</p>
          <p className="text-lg font-semibold text-foreground">{stats.total_bytes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('unreferenced')}
          </p>
          <p className="text-lg font-semibold text-foreground">{stats.unreferenced_count}</p>
        </div>
      </div>
      {stats.by_mime.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.mime')}</TableHead>
                <TableHead>{t('columns.count')}</TableHead>
                <TableHead>{t('columns.bytes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.by_mime.map((row) => (
                <TableRow key={row.mime}>
                  <TableCell className="font-mono text-xs">{row.mime}</TableCell>
                  <TableCell className="text-xs">{row.count}</TableCell>
                  <TableCell className="text-xs">{row.bytes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-body">{t('noMedia')}</p>
      )}
    </div>
  );
}

function OrphansSection() {
  const t = useTranslations('Ops.content.orphans');
  const tCommon = useTranslations('Common');
  const query = useContentOrphansQuery();
  const purge = useOrphanPurgeMutation();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<MaintenanceResult | undefined>(undefined);

  const toggle = (kind: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const execute = () => {
    purge.mutate(
      { kinds: [...selected], dryRun: false },
      {
        onSuccess: (row) =>
          setResult({
            outcome: 'success',
            message: t('executed', {
              counts: Object.entries(row.purged)
                .filter(([, count]) => count > 0)
                .map(([kind, count]) => `${kind}: ${count}`)
                .join(', ') || t('nothingPurged'),
            }),
          }),
        onError: (error) =>
          setResult({ outcome: 'error', message: serverMessage(error) }),
        onSettled: () => setConfirmOpen(false),
      },
    );
  };

  return (
    <div data-slot="content-orphans" className="flex flex-col gap-3">
      {query.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              {tCommon('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}
      {query.isPending ? (
        <div data-state="loading" role="status" aria-live="polite" className="text-sm text-body">
          {tCommon('loading')}
        </div>
      ) : null}
      {query.data ? (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.kind')}</TableHead>
                  <TableHead>{t('columns.count')}</TableHead>
                  <TableHead>{t('columns.purge')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((row: OrphanKindReport) => (
                  <TableRow key={row.kind} data-slot="content-orphan-row" data-kind={row.kind}>
                    <TableCell className="font-mono text-xs">{row.kind}</TableCell>
                    <TableCell className="text-sm">{row.count}</TableCell>
                    <TableCell>
                      <label className="flex items-center gap-2 text-xs text-body">
                        <input
                          type="checkbox"
                          aria-label={t('selectKind', { kind: row.kind })}
                          checked={selected.has(row.kind)}
                          onChange={() => toggle(row.kind)}
                        />
                        {t('selectForPurge')}
                      </label>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-body">{t('purgeHint')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || purge.isPending}
              data-slot="content-purge-submit"
              onClick={() => setConfirmOpen(true)}
            >
              {t('purgeButton')}
            </Button>
          </div>
        </>
      ) : null}
      <ResultLine slot="content-purge-result" result={result} />
      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmTitle')}
        description={t('confirmBody', { count: selected.size })}
        confirmLabel={t('confirmAction')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={purge.isPending}
        onConfirm={execute}
      />
    </div>
  );
}

function MaintenanceSection() {
  const t = useTranslations('Ops.content.maintenance');
  const reindex = useContentReindexMutation();
  const prune = useMediaPruneMutation();
  const [reindexConfirm, setReindexConfirm] = useState(false);
  const [pruneConfirm, setPruneConfirm] = useState(false);
  const [results, setResults] = useState<Partial<Record<'reindex' | 'prune', MaintenanceResult>>>(
    {},
  );

  const runReindex = (dryRun: boolean) =>
    reindex.mutate(
      { dryRun },
      {
        onSuccess: (row) =>
          setResults((prev) => ({
            ...prev,
            reindex: {
              outcome: 'success',
              message: row.dryRun
                ? t('reindex.dryRun', { indexed: row.indexed, missing: row.missing_slug })
                : t('reindex.executed', { indexed: row.indexed, ms: row.took_ms }),
            },
          })),
        onError: (error) =>
          setResults((prev) => ({
            ...prev,
            reindex: { outcome: 'error', message: serverMessage(error) },
          })),
        onSettled: () => setReindexConfirm(false),
      },
    );

  const runPrune = (dryRun: boolean) =>
    prune.mutate(
      { dryRun },
      {
        onSuccess: (row) =>
          setResults((prev) => ({
            ...prev,
            prune: {
              outcome: 'success',
              message: row.dryRun
                ? t('prune.dryRun', { removed: row.removed })
                : t('prune.executed', { removed: row.removed, bytes: row.bytes_freed }),
            },
          })),
        onError: (error) =>
          setResults((prev) => ({ ...prev, prune: { outcome: 'error', message: serverMessage(error) } })),
        onSettled: () => setPruneConfirm(false),
      },
    );

  const busy = reindex.isPending || prune.isPending;

  return (
    <div data-slot="content-maintenance" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">{t('reindex.label')}</p>
        <p className="text-xs text-body">{t('reindex.description')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-slot="content-reindex-preview"
            onClick={() => runReindex(true)}
          >
            {t('reindex.preview')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-slot="content-reindex-execute"
            onClick={() => setReindexConfirm(true)}
          >
            {t('reindex.execute')}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">{t('prune.label')}</p>
        <p className="text-xs text-body">{t('prune.description')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-slot="content-prune-preview"
            onClick={() => runPrune(true)}
          >
            {t('prune.preview')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-slot="content-prune-execute"
            onClick={() => setPruneConfirm(true)}
          >
            {t('prune.execute')}
          </Button>
        </div>
      </div>
      <ResultLine slot="content-reindex-result" result={results.reindex} />
      <ResultLine slot="content-prune-result" result={results.prune} />
      <OpsConfirmDialog
        open={reindexConfirm}
        onOpenChange={setReindexConfirm}
        title={t('reindex.confirmTitle')}
        description={t('reindex.confirmBody')}
        confirmLabel={t('reindex.confirmAction')}
        cancelLabel={t('cancel')}
        tone="neutral"
        pending={reindex.isPending}
        onConfirm={() => runReindex(false)}
      />
      <OpsConfirmDialog
        open={pruneConfirm}
        onOpenChange={setPruneConfirm}
        title={t('prune.confirmTitle')}
        description={t('prune.confirmBody')}
        confirmLabel={t('prune.confirmAction')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={prune.isPending}
        onConfirm={() => runPrune(false)}
      />
    </div>
  );
}

export function OpsContentConsole() {
  const t = useTranslations('Ops.content');
  return (
    <div data-slot="ops-content-console" className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('counts.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('counts.description')}</p>
        </div>
        <CountsSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('media.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('media.description')}</p>
        </div>
        <MediaStatsSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('orphans.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('orphans.description')}</p>
        </div>
        <OrphansSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('maintenance.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('maintenance.description')}</p>
        </div>
        <MaintenanceSection />
      </Card>
    </div>
  );
}
