'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { AuditLogRow } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { OpsDirectoryError, OpsDirectoryLoading, OpsDirectoryPagination } from '@/modules/ops/directory';
import { useAuditLogControls } from '@/modules/ops/hooks/use-audit-log-controls';
import { auditDirectoryLabels } from '@/modules/ops/lib/audit-directory-labels';
import { useAuditLogsQuery } from '@/modules/ops/queries/use-audit-logs.query';

import { OpsAuditLogFilters } from './OpsAuditLogFilters';

// C-OPSA-01 — the audit ledger table. Four columns per the console spec:
// actor, action, target, timestamp. The row's `detail` is deliberately NOT
// rendered: it is free-form JSON that carries emails and export bodies, and an
// ops table is not the place to spill it. Order is the server's (newest first)
// — the route serves no sort parameter, so no sort control is offered rather
// than faking one client-side over a single page.
const COLUMNS = ['actor', 'action', 'target', 'timestamp'] as const;

function actorLabel(row: AuditLogRow, fallback: string): string {
  return row.actor?.email ?? fallback;
}

export function OpsAuditLogTable() {
  const t = useTranslations('Ops.audit');
  const format = useFormatter();
  const controls = useAuditLogControls();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useAuditLogsQuery(controls.args, hydrated && Boolean(token));

  const labels = auditDirectoryLabels({
    paginationLabel: t('pagination.label'),
    previous: t('pagination.previous'),
    next: t('pagination.next'),
    pageCount: (values) => t('pagination.pageCount', values),
    errorTitle: t('error.title'),
    errorDescription: t('error.description'),
    retry: t('error.retry'),
    loadingLabel: t('loadingLabel'),
  });

  return (
    <section data-slot="ops-audit-log" className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-foreground">{t('ledgerTitle')}</h2>
      <OpsAuditLogFilters controls={controls} />

      {query.isPending ? <OpsDirectoryLoading labels={labels} /> : null}
      {query.isError ? (
        <OpsDirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}

      {query.data ? (
        <>
          <Table data-slot="ops-audit-table">
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    data-slot="ops-audit-empty"
                    className="py-10 text-center text-muted-foreground"
                  >
                    {controls.hasActiveFilters ? t('empty.noMatches') : t('empty.none')}
                  </TableCell>
                </TableRow>
              ) : (
                query.data.data.map((row) => (
                  <TableRow key={row.documentId} data-slot="ops-audit-row">
                    <TableCell data-field="actor">{actorLabel(row, t('actorSystem'))}</TableCell>
                    <TableCell data-field="action" className="font-medium">
                      {row.action}
                    </TableCell>
                    <TableCell data-field="target" className="font-mono text-xs">
                      {row.target ?? t('noValue')}
                    </TableCell>
                    <TableCell data-field="timestamp">
                      {format.dateTime(new Date(row.createdAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <OpsDirectoryPagination
            meta={query.data.meta.pagination}
            onPageChange={controls.setPage}
            labels={labels}
          />
        </>
      ) : null}
    </section>
  );
}
