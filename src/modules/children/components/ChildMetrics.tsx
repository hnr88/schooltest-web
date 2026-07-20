'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { CHILD_METRICS } from '@/modules/children/constants/child-metrics.constants';
import { StatCard } from '@/modules/design-system';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

interface ChildMetricsProps {
  metrics: ChildProgressMetrics;
}

export function ChildMetrics({ metrics }: ChildMetricsProps) {
  const format = useFormatter();
  const t = useTranslations('Children');

  return (
    <section aria-labelledby="child-metrics-title">
      <h2 id="child-metrics-title" className="text-lg font-bold text-foreground">
        {t('metricsHeading')}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CHILD_METRICS.map((metric) => (
          <article key={metric.key} aria-label={t(metric.labelKey)}>
            <StatCard
              icon={metric.icon}
              iconTone={metric.iconTone}
              label={t(metric.labelKey)}
              value={format.number(metrics[metric.key])}
              className="h-full border-l-4 border-blue-100 border-l-blue-600 dark:border-blue-950"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
