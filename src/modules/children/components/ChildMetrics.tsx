'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { CHILD_METRICS } from '@/modules/children/constants/child-metrics.constants';
import { MiniStatTile } from '@/modules/design-system';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

interface ChildMetricsProps {
  metrics: ChildProgressMetrics;
  className?: string;
}

// Canonical activity snapshot: ONE panel holding a row of COMPACT tiles (14px
// padding, 22px numeral, 12.5px label) — the Parent-overview idiom. The tiles are
// deliberately not full cards, so nothing stretches to match a neighbouring gauge.
export function ChildMetrics({ metrics, className }: ChildMetricsProps) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <section
      data-slot="child-activity-metrics"
      aria-labelledby="child-metrics-title"
      className={cn(
        'flex flex-col gap-4 rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id="child-metrics-title" className="text-panel-title font-semibold text-foreground">
          {t('metricsHeading')}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t('activitySnapshotDescription')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHILD_METRICS.map((metric) => (
          <article key={metric.key} aria-label={t(metric.labelKey)} className="flex">
            <MiniStatTile
              value={format.number(metrics[metric.key])}
              label={t(metric.labelKey)}
              className="w-full"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
