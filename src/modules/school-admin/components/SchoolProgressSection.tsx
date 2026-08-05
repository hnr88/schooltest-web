'use client';

import { CalendarClockIcon, ClipboardListIcon, TrendingUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard, PanelHeaderRow } from '@/modules/design-system';
import { formatTestWindow, toAcaraPhase } from '@/modules/school-admin/lib/school-analytics';

import type { SchoolProgressSectionProps } from '@/modules/school-admin/types/components.types';

// Spec section 1, Progress: the periodic reading tests, read off the same
// C-RPT-06 payload as Diagnostics. "Reading progress" is an ACARA phase and
// renders the phase LABEL; "Tests this cycle" is the plan's reading allowance;
// "Next test window" is the scheduled window as a date. Each falls back to the
// spec's empty value when the endpoint has nothing to report.
export function SchoolProgressSection({ summary }: SchoolProgressSectionProps) {
  const t = useTranslations('SchoolAdmin.home');
  const tPhase = useTranslations('SchoolStudents.form.acaraPhaseOption');
  const readingProgress = toAcaraPhase(summary.reading_progress);
  const nextTestWindow = formatTestWindow(summary.next_test_window);

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
          value={readingProgress === null ? t('noValue') : tPhase(readingProgress)}
        />
        <MetricCard
          icon={ClipboardListIcon}
          iconTone="teal"
          label={t('testsThisCycle')}
          value={String(summary.reading_tests_allowed)}
        />
        <MetricCard
          icon={CalendarClockIcon}
          iconTone="amber"
          label={t('nextTestWindow')}
          value={nextTestWindow ?? t('noValue')}
        />
      </div>
    </section>
  );
}
