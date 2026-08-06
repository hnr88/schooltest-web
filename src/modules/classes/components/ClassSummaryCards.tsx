'use client';

import { BookOpenCheckIcon, GaugeIcon, ListChecksIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard } from '@/modules/design-system';
import { EMPTY_VALUE } from '@/modules/classes/lib/class-detail.helpers';

import type { ClassSummaryCardsProps } from '@/modules/classes/types/components.types';

// Spec §1 summary cards. Every figure is C-CLS-05's `summary` verbatim — the
// only client-side work is formatting the "X / Y" fraction and the em dash for
// a class with no completed test.
export function ClassSummaryCards({ summary }: ClassSummaryCardsProps) {
  const t = useTranslations('Classes.detail.summary');
  const fraction = (completed: number): string =>
    t('completedFraction', { completed, total: summary.students });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        icon={UsersIcon}
        iconTone="blue"
        label={t('students')}
        value={String(summary.students)}
      />
      <MetricCard
        icon={BookOpenCheckIcon}
        iconTone="teal"
        label={t('testACompleted')}
        value={fraction(summary.test_a_completed)}
      />
      <MetricCard
        icon={ListChecksIcon}
        iconTone="amber"
        label={t('testBCompleted')}
        value={fraction(summary.test_b_completed)}
      />
      <MetricCard
        icon={GaugeIcon}
        iconTone="blue"
        label={t('avgReadingScore')}
        value={summary.avg_reading_score === null ? EMPTY_VALUE : String(summary.avg_reading_score)}
      />
    </div>
  );
}
