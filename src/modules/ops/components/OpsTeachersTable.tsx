'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { OpsTeachersTableProps } from '@/modules/ops/types/teachers-list.types';

const COLUMN_COUNT = 7;

// C-OPS-PORTAL-021 directory table. The pagination footer reports the SERVER's
// own meta, so "page 2 of 4 · 87 staff" is the count the query actually matched
// — never a length taken from the rows on screen.
export function OpsTeachersTable({
  rows,
  pagination,
  filtered,
  onPageChange,
  renderRow,
}: OpsTeachersTableProps) {
  const t = useTranslations('Ops.teachers');
  const lastPage = Math.max(pagination.pageCount, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-slot="ops-teachers-table">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3 font-medium">{t('columnFirstName')}</th>
              <th className="py-2 pr-3 font-medium">{t('columnLastName')}</th>
              <th className="py-2 pr-3 font-medium">{t('columnEmail')}</th>
              <th className="py-2 pr-3 font-medium">{t('columnSpecialty')}</th>
              <th className="py-2 pr-3 font-medium">{t('columnClass')}</th>
              <th className="py-2 pr-3 font-medium">{t('columnLastActive')}</th>
              <th className="sr-only py-2 font-medium">{t('columnActions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => renderRow(row))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="py-8 text-center text-muted-foreground"
                  data-slot="ops-teachers-empty"
                >
                  {filtered ? t('noMatches') : t('empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" data-slot="ops-teachers-page-status">
          {t('pageStatus', {
            page: pagination.page,
            pageCount: lastPage,
            total: pagination.total,
          })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="ops-teachers-prev"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            {t('previousPage')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="ops-teachers-next"
            disabled={pagination.page >= lastPage}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            {t('nextPage')}
          </Button>
        </div>
      </div>
    </div>
  );
}
