'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import type { SystemHealth, SystemProbe, SystemProbeKey } from '@schooltest/ops-contracts';

import { Alert, Badge, Button, Card } from '@/modules/design-system';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useSystemBackupsQuery } from '@/modules/ops/queries/use-system-backups.query';
import { useSystemHealthQuery } from '@/modules/ops/queries/use-system-health.query';
import { useSystemInfoQuery } from '@/modules/ops/queries/use-system-info.query';
import { useSystemMigrationsQuery } from '@/modules/ops/queries/use-system-migrations.query';

/**
 * Ledger row 5b — the ops System console READ layer (C-OPSY-04/06/07/10).
 *
 * Four independent reads, four independent states: a failing read shows its
 * own error with an explicit retry (never retried behind the operator's back,
 * so a 403 is not mistaken for a slow load). The health tiles render the
 * server's probes AS THEY COME — including a down probe, which is a real
 * state on this stack and exactly what this console exists to surface. The
 * mutation half (backup run, cache clear, sitemap, pipeline control) is
 * ledger slices 5c/5d and deliberately absent here.
 */

const PROBE_KEYS: SystemProbeKey[] = ['database', 'redis', 'queues', 'storage', 'web'];

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function SectionError({ onRetry, errorTitle, errorDescription, retryLabel }: {
  onRetry: () => void;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
}) {
  return (
    <Alert
      variant="error"
      title={errorTitle}
      action={
        <Button type="button" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      }
    >
      {errorDescription}
    </Alert>
  );
}

function SectionLoading({ children }: { children: ReactNode }) {
  return (
    <div
      data-state="loading"
      role="status"
      aria-live="polite"
      className="rounded-xl border bg-card p-6 text-sm text-body"
    >
      {children}
    </div>
  );
}

function probeTone(probe: SystemProbe): 'success' | 'error' {
  return probe.status === 'up' ? 'success' : 'error';
}

function HealthTile({ probeKey, probe, label }: { probeKey: SystemProbeKey; probe: SystemProbe; label: string }) {
  const t = useTranslations('Ops.system');
  return (
    <div
      data-slot="system-health-probe"
      data-probe={probeKey}
      data-status={probe.status}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <Badge variant={probeTone(probe)}>{t(`health.status.${probe.status}`)}</Badge>
      </div>
      <p className="text-xs text-body">{t('health.latency', { ms: probe.latency_ms })}</p>
      {probe.detail ? <p className="text-xs text-body">{probe.detail}</p> : null}
    </div>
  );
}

function HealthSection() {
  const t = useTranslations('Ops.system');
  const tCommon = useTranslations('Common');
  const query = useSystemHealthQuery();

  if (query.isError) {
    return (
      <SectionError
        onRetry={() => void query.refetch()}
        errorTitle={t('health.errorTitle')}
        errorDescription={t('health.errorDescription')}
        retryLabel={tCommon('retry')}
      />
    );
  }
  if (query.isPending || !query.data) {
    return <SectionLoading>{tCommon('loading')}</SectionLoading>;
  }

  const health: SystemHealth = query.data;
  return (
    <div
      data-slot="system-health"
      data-overall={health.overall.status}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <Badge variant={probeTone(health.overall)}>{t(`health.status.${health.overall.status}`)}</Badge>
        <span className="text-sm text-body">
          {t('health.overall', { ms: health.overall.latency_ms })}
        </span>
        {health.overall.detail ? <span className="text-xs text-body">{health.overall.detail}</span> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROBE_KEYS.map((key) => (
          <HealthTile key={key} probeKey={key} probe={health[key]} label={t(`health.probes.${key}`)} />
        ))}
      </div>
    </div>
  );
}

function InfoSection() {
  const t = useTranslations('Ops.system');
  const tCommon = useTranslations('Common');
  const query = useSystemInfoQuery();

  if (query.isError) {
    return (
      <SectionError
        onRetry={() => void query.refetch()}
        errorTitle={t('info.errorTitle')}
        errorDescription={t('info.errorDescription')}
        retryLabel={tCommon('retry')}
      />
    );
  }
  if (query.isPending || !query.data) {
    return <SectionLoading>{tCommon('loading')}</SectionLoading>;
  }

  const info = query.data;
  const rows = [
    { label: t('info.fields.strapiVersion'), value: info.strapi_version },
    { label: t('info.fields.nodeVersion'), value: info.node_version },
    { label: t('info.fields.uptime'), value: formatUptime(info.uptime_s) },
    { label: t('info.fields.env'), value: info.env },
    { label: t('info.fields.database'), value: info.database.client },
    { label: t('info.fields.timezone'), value: info.timezone },
    { label: t('info.fields.queues'), value: info.queues.join(', ') },
  ] as const;
  return (
    <dl data-slot="system-info" className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {row.label}
          </dt>
          <dd className="text-sm text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MigrationsSection() {
  const t = useTranslations('Ops.system');
  const tCommon = useTranslations('Common');
  const query = useSystemMigrationsQuery();

  if (query.isError) {
    return (
      <SectionError
        onRetry={() => void query.refetch()}
        errorTitle={t('migrations.errorTitle')}
        errorDescription={t('migrations.errorDescription')}
        retryLabel={tCommon('retry')}
      />
    );
  }
  if (query.isPending || !query.data) {
    return <SectionLoading>{tCommon('loading')}</SectionLoading>;
  }

  const migrations = query.data;
  return (
    <div data-slot="system-migrations" className="flex flex-col gap-2">
      <p className="text-sm text-body">{t('migrations.count', { count: migrations.count })}</p>
      <div className="max-h-72 overflow-y-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('migrations.columns.name')}</TableHead>
              <TableHead>{t('migrations.columns.appliedAt')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {migrations.rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-mono text-xs">{row.name}</TableCell>
                <TableCell className="text-xs">{row.time ?? t('migrations.never')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BackupsSection() {
  const t = useTranslations('Ops.system');
  const tCommon = useTranslations('Common');
  const query = useSystemBackupsQuery();

  if (query.isError) {
    return (
      <SectionError
        onRetry={() => void query.refetch()}
        errorTitle={t('backups.errorTitle')}
        errorDescription={t('backups.errorDescription')}
        retryLabel={tCommon('retry')}
      />
    );
  }
  if (query.isPending || !query.data) {
    return <SectionLoading>{tCommon('loading')}</SectionLoading>;
  }

  const backups = query.data;
  if (backups.length === 0) {
    return (
      <p data-slot="system-backups" data-state="empty" className="text-sm text-body">
        {t('backups.empty')}
      </p>
    );
  }
  return (
    <div data-slot="system-backups" className="max-h-72 overflow-y-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('backups.columns.filename')}</TableHead>
            <TableHead>{t('backups.columns.bytes')}</TableHead>
            <TableHead>{t('backups.columns.status')}</TableHead>
            <TableHead>{t('backups.columns.startedAt')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.map((row) => (
            <TableRow key={row.documentId}>
              <TableCell className="font-mono text-xs">{row.filename}</TableCell>
              <TableCell className="text-xs">{row.bytes}</TableCell>
              <TableCell className="text-xs">{t(`backups.status.${row.status}`)}</TableCell>
              <TableCell className="text-xs">{row.started_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function OpsSystemConsole() {
  const t = useTranslations('Ops.system');
  return (
    <div data-slot="ops-system-console" className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('health.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('health.description')}</p>
        </div>
        <HealthSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('info.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('info.description')}</p>
        </div>
        <InfoSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('migrations.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('migrations.description')}</p>
        </div>
        <MigrationsSection />
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('backups.title')}</h2>
          <p className="mt-1 text-sm text-body">{t('backups.description')}</p>
        </div>
        <BackupsSection />
      </Card>
    </div>
  );
}
