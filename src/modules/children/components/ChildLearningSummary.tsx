'use client';

import { ClipboardCheck, TimerReset } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Eyebrow, ProgressBar } from '@/modules/design-system';
import { getCompletionPercent } from '@/modules/children/lib/child-learning-progress';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

function ChildLearningSummary({ metrics }: { metrics: ChildProgressMetrics }) {
  const format = useFormatter();
  const t = useTranslations('Children');
  const completionPercent = getCompletionPercent(metrics);

  return (
    <section
      data-slot="child-learning-summary"
      aria-labelledby="child-learning-summary-title"
      className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm lg:grid-cols-2 lg:items-center lg:p-6"
    >
      <div>
        <Eyebrow>{t('learningDashboardEyebrow')}</Eyebrow>
        <h2 id="child-learning-summary-title" className="mt-2 text-xl font-bold text-foreground">
          {t('learningSummaryHeading')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {completionPercent === null
            ? t('noSessionProgress')
            : t('completionDescription', {
                completed: format.number(metrics.completedSessions),
                total: format.number(metrics.totalSessions),
              })}
        </p>
        <ProgressBar
          value={completionPercent ?? 0}
          ariaLabel={t('completionLabel')}
          className="mt-5"
        />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-muted p-4 lg:min-w-48">
        {completionPercent === null ? (
          <TimerReset aria-hidden="true" className="size-6 text-muted-foreground" />
        ) : (
          <ClipboardCheck aria-hidden="true" className="size-6 text-primary" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{t('completionLabel')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {completionPercent === null
              ? t('notAvailable')
              : t('completionPercent', { percent: format.number(completionPercent) })}
          </p>
        </div>
      </div>
    </section>
  );
}

export { ChildLearningSummary };
