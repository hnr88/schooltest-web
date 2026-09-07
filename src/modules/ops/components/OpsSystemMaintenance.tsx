'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Card } from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { useSystemBackupMutation } from '@/modules/ops/queries/use-system-backup.mutation';
import { useSystemCacheClearMutation } from '@/modules/ops/queries/use-system-cache-clear.mutation';
import { useSystemSitemapMutation } from '@/modules/ops/queries/use-system-sitemap.mutation';

/**
 * Ledger row 5c — the System console's three mutation actions
 * (C-OPSY-01/02/03). Every action is gated behind a confirmation, and every
 * result line renders what the server ACTUALLY said — a real key count, the
 * measured URL count, the recorded ledger row — or the server's own error
 * message on failure. There is no fake success: a sitemap regeneration whose
 * web app did not answer shows the gateway failure verbatim.
 */

type ActionId = 'backup' | 'cache-clear' | 'sitemap';

interface MutationResult {
  outcome: 'success' | 'error';
  message: string;
}

function serverMessage(error: unknown): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (error instanceof Error ? error.message : String(error))
  );
}

const CACHE_SCOPES = ['all', 'settings', 'search', 'legal'] as const;

export function OpsSystemMaintenance() {
  const t = useTranslations('Ops.system.maintenance');
  const backup = useSystemBackupMutation();
  const cacheClear = useSystemCacheClearMutation();
  const sitemap = useSystemSitemapMutation();

  const [confirming, setConfirming] = useState<ActionId | null>(null);
  const [cacheScope, setCacheScope] = useState<(typeof CACHE_SCOPES)[number]>('legal');
  const [results, setResults] = useState<Partial<Record<ActionId, MutationResult>>>({});

  const record = (id: ActionId, result: MutationResult) =>
    setResults((prev) => ({ ...prev, [id]: result }));

  const runBackup = () =>
    backup.mutate(undefined, {
      onSuccess: (row) =>
        record('backup', {
          outcome: 'success',
          message: t('backup.success', { filename: row.filename, bytes: row.bytes }),
        }),
      onError: (error) => record('backup', { outcome: 'error', message: serverMessage(error) }),
      onSettled: () => setConfirming(null),
    });

  const runCacheClear = () =>
    cacheClear.mutate(
      { scope: cacheScope },
      {
        onSuccess: (row) =>
          record('cache-clear', {
            outcome: 'success',
            message: t('cacheClear.success', { scope: row.scope, count: row.keys_cleared }),
          }),
        onError: (error) =>
          record('cache-clear', { outcome: 'error', message: serverMessage(error) }),
        onSettled: () => setConfirming(null),
      },
    );

  const runSitemap = () =>
    sitemap.mutate(undefined, {
      onSuccess: (row) =>
        record('sitemap', {
          outcome: 'success',
          message: t('sitemap.success', { count: row.urls }),
        }),
      onError: (error) => record('sitemap', { outcome: 'error', message: serverMessage(error) }),
      onSettled: () => setConfirming(null),
    });

  const busy = backup.isPending || cacheClear.isPending || sitemap.isPending;

  const actions = [
    {
      id: 'backup' as const,
      label: t('backup.label'),
      description: t('backup.description'),
      tone: 'neutral' as const,
    },
    {
      id: 'cache-clear' as const,
      label: t('cacheClear.label'),
      description: t('cacheClear.description'),
      tone: 'destructive' as const,
    },
    {
      id: 'sitemap' as const,
      label: t('sitemap.label'),
      description: t('sitemap.description'),
      tone: 'neutral' as const,
    },
  ];

  return (
    <div data-slot="ops-system-maintenance" className="flex flex-col gap-4">
      {actions.map((action) => (
        <div
          key={action.id}
          data-slot={`system-action-${action.id}`}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
              {action.tone === 'destructive' ? (
                <Badge variant="warning">{t('disruptiveBadge')}</Badge>
              ) : null}
            </div>
            <p className="text-xs text-body">{action.description}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {action.id === 'cache-clear' ? (
              <label className="flex items-center gap-2 text-xs text-body">
                {t('cacheClear.scopeLabel')}
                <select
                  data-slot="system-cache-scope"
                  value={cacheScope}
                  onChange={(event) =>
                    setCacheScope(event.target.value as (typeof CACHE_SCOPES)[number])
                  }
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                >
                  {CACHE_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              data-slot={`system-action-run-${action.id}`}
              onClick={() => setConfirming(action.id)}
            >
              {action.label}
            </Button>
          </div>
        </div>
      ))}

      {actions.map((action) => {
        const result = results[action.id];
        if (!result) return null;
        return (
          <p
            key={action.id}
            data-slot="system-mutation-result"
            data-action={action.id}
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
      })}

      <OpsConfirmDialog
        open={confirming === 'backup'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('backup.confirmTitle')}
        description={t('backup.confirmBody')}
        confirmLabel={t('backup.confirmAction')}
        cancelLabel={t('cancel')}
        tone="neutral"
        pending={backup.isPending}
        onConfirm={runBackup}
      />
      <OpsConfirmDialog
        open={confirming === 'cache-clear'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('cacheClear.confirmTitle', { scope: cacheScope })}
        description={t('cacheClear.confirmBody', { scope: cacheScope })}
        confirmLabel={t('cacheClear.confirmAction')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={cacheClear.isPending}
        onConfirm={runCacheClear}
      />
      <OpsConfirmDialog
        open={confirming === 'sitemap'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('sitemap.confirmTitle')}
        description={t('sitemap.confirmBody')}
        confirmLabel={t('sitemap.confirmAction')}
        cancelLabel={t('cancel')}
        tone="neutral"
        pending={sitemap.isPending}
        onConfirm={runSitemap}
      />
    </div>
  );
}
