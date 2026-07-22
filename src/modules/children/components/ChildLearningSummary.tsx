'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { GaugeRing, InsightCallout } from '@/modules/design-system';
import {
  getCompletionInsight,
  getCompletionPercent,
} from '@/modules/children/lib/child-learning-progress';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

// C-PARENT-CHILD-PROGRESS learning panel: the gauge carries the ratio, the
// callout carries the sentence. No navy, no eyebrow, no second progress bar.
function ChildLearningSummary({ metrics }: { metrics: ChildProgressMetrics }) {
  const format = useFormatter();
  const t = useTranslations('Children');
  const percent = getCompletionPercent(metrics);
  const insight = getCompletionInsight(metrics);
  const counts = {
    completed: format.number(metrics.completedSessions),
    total: format.number(metrics.totalSessions),
  };

  return (
    <section
      data-slot="child-learning-summary"
      aria-labelledby="child-learning-summary-title"
      className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2
        id="child-learning-summary-title"
        className="text-panel-title font-semibold text-foreground"
      >
        {t('learningSummaryHeading')}
      </h2>
      <GaugeRing
        value={percent ?? 0}
        display={percent === null ? '—' : format.number(percent / 100, { style: 'percent' })}
        caption={`${counts.completed}/${counts.total}`}
        ariaLabel={t('completionLabel')}
        className="self-center"
      />
      <InsightCallout icon={insight.icon} tone={insight.tone} className="mt-auto items-start">
        {t(insight.messageKey, counts)}
      </InsightCallout>
    </section>
  );
}

export { ChildLearningSummary };
