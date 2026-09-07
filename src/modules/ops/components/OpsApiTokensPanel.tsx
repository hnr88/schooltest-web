'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ApiTokenRow } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { OpsDirectoryError, OpsDirectoryLoading } from '@/modules/ops/directory';
import { auditDirectoryLabels } from '@/modules/ops/lib/audit-directory-labels';
import { useApiTokensQuery } from '@/modules/ops/queries/use-api-tokens.query';
import { useRevokeApiTokenMutation } from '@/modules/ops/queries/use-revoke-api-token.mutation';

import { OpsConfirmDialog } from './OpsConfirmDialog';

// C-OPSA-02 — the API-token inventory and its ONE destructive control.
//
// Revoke is a hard delete server-side, so it is gated behind the ops overlay
// set's destructive confirmation: an AlertDialog that names the irreversible
// consequence and cannot be dismissed by a backdrop click. The token secret is
// never displayed because the server never sends it.
const COLUMNS = ['name', 'type', 'lastUsed', 'created', 'actions'] as const;

export function OpsApiTokensPanel() {
  const t = useTranslations('Ops.audit.tokens');
  const tAudit = useTranslations('Ops.audit');
  const format = useFormatter();
  const [target, setTarget] = useState<ApiTokenRow | null>(null);
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useApiTokensQuery(hydrated && Boolean(token));
  const revoke = useRevokeApiTokenMutation();

  const labels = auditDirectoryLabels({
    paginationLabel: tAudit('pagination.label'),
    previous: tAudit('pagination.previous'),
    next: tAudit('pagination.next'),
    pageCount: (values) => tAudit('pagination.pageCount', values),
    errorTitle: t('errorTitle'),
    errorDescription: t('errorDescription'),
    retry: tAudit('error.retry'),
    loadingLabel: t('loadingLabel'),
  });

  const stamp = (value: string | null) =>
    value ? format.dateTime(new Date(value), { dateStyle: 'medium' }) : tAudit('noValue');

  return (
    <section data-slot="ops-api-tokens" className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      <p className="text-sm text-body">{t('description')}</p>

      {query.isPending ? <OpsDirectoryLoading labels={labels} /> : null}
      {query.isError ? (
        <OpsDirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}

      {query.data ? (
        <Table data-slot="ops-api-tokens-table">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.data.map((row) => (
              <TableRow key={row.id} data-slot="ops-api-token-row" data-token-name={row.name}>
                <TableCell data-field="name" className="font-medium">
                  {row.name}
                </TableCell>
                <TableCell data-field="type">
                  <Badge>{row.type}</Badge>
                </TableCell>
                <TableCell data-field="last-used">{stamp(row.lastUsedAt)}</TableCell>
                <TableCell data-field="created">{stamp(row.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-slot="ops-token-revoke"
                    onClick={() => setTarget(row)}
                  >
                    {t('revoke')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <OpsConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={t('confirmTitle')}
        description={t('confirmBody', { name: target?.name ?? '' })}
        confirmLabel={t('confirmAction')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={revoke.isPending}
        onConfirm={() => {
          if (!target) return;
          revoke.mutate(target.id, { onSettled: () => setTarget(null) });
        }}
      />
    </section>
  );
}
