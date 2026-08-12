'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  MONITOR_SUMMARY_LABEL_KEY,
  MONITOR_SUMMARY_VALUE_CLASS,
} from '@/modules/teacher/constants/live-monitor.constants';
import type { LiveMonitorSummaryProps } from '@/modules/teacher/types/live-monitor.types';

// The five stat tiles above the grid: Expected · Joined · In progress ·
// Submitted · Stalled (.qa/DESIGN.md §Live monitoring). Every number is C-TS-3's
// own `summary` — the portal never counts the tiles below to fill these in, so
// the row can never disagree with the grid.
//
// A real <dl>: each label is the term for its value, so the pairing survives a
// screen reader and the value's ink is decoration on top of a printed label.
function LiveMonitorSummary({ items }: LiveMonitorSummaryProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const format = useFormatter();

  return (
    <dl
      data-slot="live-monitor-summary"
      aria-label={t('summaryLabel')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {items.map((item) => (
        <div
          key={item.key}
          data-slot="live-monitor-stat"
          data-stat={item.key}
          className="flex flex-col items-center gap-0.5 rounded-tile bg-surface-inset px-3 py-3"
        >
          <dd
            className={cn(
              'order-1 text-stat-sm font-bold tabular-nums',
              MONITOR_SUMMARY_VALUE_CLASS[item.key],
            )}
          >
            {format.number(item.value)}
          </dd>
          <dt className="order-2 text-center text-meta text-body">
            {t(MONITOR_SUMMARY_LABEL_KEY[item.key])}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export { LiveMonitorSummary };
