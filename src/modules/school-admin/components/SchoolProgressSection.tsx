'use client';

import { CalendarClockIcon, ClipboardListIcon, TrendingUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard, PanelHeaderRow } from '@/modules/design-system';

import type { SchoolProgressSectionProps } from '@/modules/school-admin/types/components.types';

// Spec section 1, Progress: the periodic reading tests. "Tests this cycle" is
// the plan's reading allowance from C-ENT-01; "Reading progress" and "Next test
// window" have no backing endpoint today and render the spec's empty value.
export function SchoolProgressSection({ readingTestsAllowed }: SchoolProgressSectionProps) {
  const t = useTranslations('SchoolAdmin.home');

  return (
    <section
      data-slot="school-progress"
      aria-labelledby="school-progress-title"
      className="flex flex-col gap-3"
    >
      <PanelHeaderRow
        as="h2"
        titleId="school-progress-title"
        title={t('progressTitle')}
        description={t('progressSubtitle')}
      />
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={TrendingUpIcon}
          iconTone="blue"
          label={t('readingProgress')}
          value={t('noValue')}
        />
        <MetricCard
          icon={ClipboardListIcon}
          iconTone="teal"
          label={t('testsThisCycle')}
          value={String(readingTestsAllowed)}
        />
        <MetricCard
          icon={CalendarClockIcon}
          iconTone="amber"
          label={t('nextTestWindow')}
          value={t('noValue')}
        />
      </div>
    </section>
  );
}
