'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import { useSittingSummaryQuery } from '@/modules/test-day/queries/use-sitting-summary.query';
import type { ClassSitting } from '@/modules/test-day/types/test-day.types';

import type { SittingSummaryPanelProps } from '@/modules/test-day/types/components.types';

// Count label keys mapped to the SittingSummary fields (C-SIT-08 contract
// names are snake_case; the i18n labels stay camelCase like the monitor's).
const SUMMARY_COUNTS = [
  { key: 'sat', field: 'sat' },
  { key: 'absent', field: 'absent' },
  { key: 'needsResit', field: 'needs_resit' },
  { key: 'resultsPending', field: 'results_pending' },
  { key: 'resultsReady', field: 'results_ready' },
] as const;

// C-SIT-08 end-of-test-day summary (task 136, mvp-updates 4.5 steps 5-6): who
// sat, who was absent, who needs a re-sit, and whether results are in. The
// panel reads the live summary for the class's current sitting; the
// no-sitting case never reaches this component (TestDayScreen only mounts it
// when a sitting exists, and the W21 history empty state covers the rest).
// Presentational in the SittingHistoryTable sense: the only data work is the
// boundary-parsed summary query; the payload renders as-is.
export function SittingSummaryPanel({ sitting }: SittingSummaryPanelProps) {
  const t = useTranslations('Teach.testDay.summary');
  const tStatus = useTranslations('TestDay.status');
  const summary = useSittingSummaryQuery(sitting.documentId);
  const data = summary.data ?? null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('title')}>
      <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      {summary.isPending ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {summary.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}
      {data ? (
        <div
          data-slot="sitting-summary"
          className="flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            {data.sitting.code ? (
              <span className="text-sm font-semibold text-foreground">
                {t('codeLine', { code: data.sitting.code })}
              </span>
            ) : null}
            <StatusPill tone={data.sitting.status === 'open' ? 'success' : 'neutral'}>
              {tStatus(data.sitting.status)}
            </StatusPill>
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {SUMMARY_COUNTS.map(({ key, field }) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="text-sm text-muted-foreground">{t(`counts.${key}`)}</dt>
                <dd className="text-sm font-semibold text-foreground">{data[field]}</dd>
              </div>
            ))}
          </dl>
          {data.results_pending > 0 ? (
            <p className="text-sm text-body">{t('pendingNote', { count: data.results_pending })}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
