'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { ChildHeroCompletion } from '@/modules/children/components/ChildHeroCompletion';
import { CHILD_METRICS } from '@/modules/children/constants/child-metrics.constants';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

// §B.2 KpiStrip — the r24 white card of label-over-value cells with hairline
// gutters. The design's five cells are `Overall level` (B-9, a forbidden
// cross-skill composite), `Progress to {next} %` (B-4), `Practice streak` (no
// streak field exists anywhere), `Last result %` (B-3) and `Since joining
// +2 levels` (B-10). NOT ONE of them is buildable, so the strip carries the four
// counts the progress read really returns; 0 prints as 0, never as "—".
export function ChildKpiStrip({ metrics }: { metrics: ChildProgressMetrics }) {
  const t = useTranslations('Children');
  const format = useFormatter();

  return (
    <section
      data-slot="child-learning-hero"
      className="flex animate-in flex-col gap-5 rounded-card bg-card px-6 py-6 shadow-sm duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7"
    >
      <dl
        data-slot="stat-strip"
        aria-label={t('metricsHeading')}
        className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4 lg:[&>*+*]:border-l lg:[&>*+*]:border-divider lg:[&>*+*]:pl-6"
      >
        {CHILD_METRICS.map((metric) => (
          <div key={metric.key} className="flex min-w-0 flex-col gap-1.5">
            <dt className="truncate text-meta text-muted-foreground">{t(metric.labelKey)}</dt>
            <dd className="text-portal-kpi font-bold text-foreground tabular-nums">
              {format.number(metrics[metric.key])}
            </dd>
          </div>
        ))}
      </dl>
      <ChildHeroCompletion metrics={metrics} />
    </section>
  );
}
