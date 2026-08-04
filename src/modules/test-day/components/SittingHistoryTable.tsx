'use client';

import { format } from 'date-fns';
import { History } from 'lucide-react';

import { useTranslations } from 'next-intl';

import {
  EmptyState,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { useSittingHistoryQuery } from '@/modules/test-day/queries/use-sitting-history.query';

import type { SittingHistoryTableProps } from '@/modules/test-day/types/components.types';

// Same date pattern the staff table uses for its timestamps.
const OPENED_AT_PATTERN = 'd MMM yyyy';

// C-SIT-07 sitting history (task 131, mvp-updates 4.5/4.6): every sitting the
// class has run, newest first, with joined/submitted counts so staggered and
// catch-up sittings stay visible after they close. Presentational: the only
// data work is the boundary-parsed history query; rows render as-is.
export function SittingHistoryTable({ classDocumentId }: SittingHistoryTableProps) {
  const t = useTranslations('Teach.testDay.history');
  const history = useSittingHistoryQuery(classDocumentId);
  const rows = history.data ?? [];

  return (
    <section className="flex flex-col gap-3" aria-label={t('title')}>
      <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      {history.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {history.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}
      {history.isSuccess && rows.length === 0 ? (
        <EmptyState icon={History} title={t('emptyTitle')} description={t('emptyBody')} />
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.opened')}</TableHead>
                <TableHead>{t('columns.code')}</TableHead>
                <TableHead>{t('columns.form')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead>{t('columns.joined')}</TableHead>
                <TableHead>{t('columns.submitted')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.documentId}>
                  <TableCell>
                    {row.opened_at
                      ? format(new Date(row.opened_at), OPENED_AT_PATTERN)
                      : t('missingValue')}
                  </TableCell>
                  <TableCell>{row.code ?? t('missingValue')}</TableCell>
                  <TableCell>{row.form_code ?? t('missingValue')}</TableCell>
                  <TableCell>
                    <StatusPill tone={row.status === 'open' ? 'success' : 'neutral'}>
                      {t(`status.${row.status}`)}
                    </StatusPill>
                  </TableCell>
                  <TableCell>{t('joinedCount', { joined: row.joined, total: row.total })}</TableCell>
                  <TableCell>
                    {t('submittedCount', { submitted: row.submitted, total: row.total })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
