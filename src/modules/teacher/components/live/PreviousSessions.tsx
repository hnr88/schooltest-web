'use client';

import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { HISTORY_COLUMNS } from '@/modules/teacher/constants/live-tab.constants';
import { dayMonthLabel } from '@/modules/teacher/lib/live-tab';
import type { HistoryRow } from '@/modules/teacher/types/live-tab.types';

const [TEST, CODE, DATE, COMPLETED, STATUS] = HISTORY_COLUMNS;
const CELL = 'text-[13.5px] text-[#4B5563]';

// Teacher Portal v2.dc.html:1265–1288 — Previous sessions: the class's live sittings
// and the newest sessions that ran, with the served form, code, open date and
// completed of expected.
function PreviousSessions({
  rows,
  truncated,
  isError,
}: {
  rows: readonly HistoryRow[];
  truncated: boolean;
  isError: boolean;
}) {
  const t = useTranslations('TeacherPortal.live.history');
  const tKit = useTranslations('TeacherPortal.kit');
  const locale = useLocale();
  const noValue = tKit('noValue');

  return (
    <section
      data-slot="live-history"
      aria-labelledby="live-history-title"
      className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[30px] pb-[18px]"
    >
      <div className="pt-[22px] pb-3">
        <h3 id="live-history-title" className="text-[16px] font-semibold text-navy-900">
          {t('pastTitle')}
        </h3>
        <p className="mt-[5px] text-[13px] text-[#6B7280]">{t('pastSubtitle')}</p>
      </div>
      <div role="table" aria-labelledby="live-history-title">
        <div
          role="row"
          className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-[#ECEEF2] py-2.5 text-[11.5px] font-semibold tracking-[0.05em] text-[#6B7280] uppercase"
        >
          {HISTORY_COLUMNS.map((column) => (
            <span key={column.key} role="columnheader" className={column.className}>
              {t(`columns.${column.key}`)}
            </span>
          ))}
        </div>
        {rows.map((row, index) => (
          <div
            key={row.documentId}
            role="row"
            data-slot="live-history-row"
            data-sitting-id={row.documentId}
            data-status={row.isLive ? 'live' : 'closed'}
            className={cn(
              'flex flex-wrap items-center gap-x-3.5 gap-y-2.5 py-3.5',
              index < rows.length - 1 && 'border-b border-[#EEF1F6]',
            )}
          >
            <span role="cell" className={cn(TEST.className, 'text-[14px] font-semibold text-navy-900')}>
              {row.test ?? noValue}
            </span>
            <span role="cell" className={cn(CODE.className, CELL, 'font-semibold tracking-[0.02em] tabular-nums')}>
              {row.code ?? noValue}
            </span>
            <span role="cell" className={cn(DATE.className, CELL)}>
              {row.openedAt === null ? noValue : dayMonthLabel(row.openedAt, locale)}
            </span>
            <span role="cell" className={cn(COMPLETED.className, CELL, 'tabular-nums')}>
              {t('completed', { done: row.completed, total: row.expected })}
            </span>
            <span role="cell" className={STATUS.className}>
              <ToneChip tone={row.isLive ? 'danger' : 'navy'} size="lg">
                {row.isLive ? t('live') : t('closed')}
              </ToneChip>
            </span>
          </div>
        ))}
      </div>
      {isError ? (
        <p role="alert" className="pt-4 text-[13.5px] text-[#B42318]">
          {t('loadError')}
        </p>
      ) : null}
      {!isError && rows.length === 0 ? (
        <p className="py-9 text-center text-[13.5px] text-[#6B7280]">{t('empty')}</p>
      ) : null}
      {truncated ? <p className="pt-3 text-[12.5px] text-[#6B7280]">{t('truncated', { count: rows.length })}</p> : null}
    </section>
  );
}

export { PreviousSessions };
