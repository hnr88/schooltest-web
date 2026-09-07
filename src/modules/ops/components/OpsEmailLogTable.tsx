'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { COMMS_PAGE_SIZE_DEFAULT } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import {
  DIRECTORY_DEFAULT_LABELS,
  OpsDirectoryError,
  OpsDirectoryLoading,
  OpsDirectoryPagination,
} from '@/modules/ops/directory';
import { useEmailLogQuery } from '@/modules/ops/queries/use-email-log.query';

// C-OPSM-03 — the auth-email issuance ledger.
//
// Three columns, because the server projects exactly three fields. The row's
// `token_hash` is a CREDENTIAL and never leaves the API, so there is nothing to
// hide here — but that is why no fourth column can be added without an API
// change, and why this table must not grow a "resend" control: issuance is a
// side effect of the auth flows, not an ops action.
//
// Page state is LOCAL, not URL-backed. The Audit ledger puts its controls in
// the URL because they are filters worth sharing; this read has no filters at
// all, so a shareable `?page=` would be link noise. `pageSize` stays the
// contract default — the route accepts it, but nothing here needs to change it.
const COLUMNS = ['kind', 'email', 'issued'] as const;

export function OpsEmailLogTable() {
  const t = useTranslations('Ops.comms');
  const format = useFormatter();
  const [page, setPage] = useState(1);
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useEmailLogQuery(
    { page, pageSize: COMMS_PAGE_SIZE_DEFAULT },
    hydrated && Boolean(token),
  );

  const labels = {
    ...DIRECTORY_DEFAULT_LABELS,
    paginationLabel: t('log.pagination.label'),
    previous: t('log.pagination.previous'),
    next: t('log.pagination.next'),
    pageCount: (values: { page: number; pageCount: number; total: number }) =>
      t('log.pagination.pageCount', values),
    errorTitle: t('log.error.title'),
    errorDescription: t('log.error.description'),
    retry: t('log.error.retry'),
    loadingLabel: t('log.loadingLabel'),
  };

  return (
    <section data-slot="ops-email-log" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t('log.title')}</h2>
        <p className="text-sm text-body">{t('log.description')}</p>
      </div>

      {query.isPending ? <OpsDirectoryLoading labels={labels} /> : null}
      {query.isError ? (
        <OpsDirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}

      {query.data ? (
        <>
          <Table data-slot="ops-email-log-table">
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column}>{t(`log.columns.${column}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    data-slot="ops-email-log-empty"
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t('log.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                query.data.data.map((row) => (
                  <TableRow
                    key={`${row.createdAt}-${row.email ?? 'none'}-${row.kind ?? 'none'}`}
                    data-slot="ops-email-log-row"
                  >
                    <TableCell data-field="kind" className="font-medium">
                      {row.kind ?? t('noValue')}
                    </TableCell>
                    <TableCell data-field="email">{row.email ?? t('noValue')}</TableCell>
                    <TableCell data-field="issued">
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
            onPageChange={setPage}
            labels={labels}
          />
        </>
      ) : null}
    </section>
  );
}
