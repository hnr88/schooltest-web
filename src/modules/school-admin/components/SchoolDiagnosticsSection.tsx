'use client';

import { BookOpenCheckIcon, GaugeIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard, PanelHeaderRow } from '@/modules/design-system';

import type { SchoolDiagnosticsSectionProps } from '@/modules/school-admin/types/components.types';

// Spec section 1, Diagnostics: the initial placement reading tests aggregated
// across every class. "Avg. reading level" has no backing endpoint today, so it
// renders the spec's empty value rather than an invented figure.
export function SchoolDiagnosticsSection({
  studentsTested,
  readingTestsCompleted,
  readingTestsAllowed,
}: SchoolDiagnosticsSectionProps) {
  const t = useTranslations('SchoolAdmin.home');

  return (
    <section
      data-slot="school-diagnostics"
      aria-labelledby="school-diagnostics-title"
      className="flex flex-col gap-3"
    >
      <PanelHeaderRow
        as="h2"
        titleId="school-diagnostics-title"
        title={t('diagnosticsTitle')}
        description={t('diagnosticsSubtitle')}
      />
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={UsersIcon}
          iconTone="blue"
          label={t('studentsTested')}
          value={String(studentsTested)}
        />
        <MetricCard
          icon={GaugeIcon}
          iconTone="teal"
          label={t('avgReadingLevel')}
          value={t('noValue')}
        />
        <MetricCard
          icon={BookOpenCheckIcon}
          iconTone="amber"
          label={t('readingTestsCompleted')}
          value={t('testsCompletedValue', {
            completed: readingTestsCompleted,
            total: readingTestsAllowed,
          })}
        />
      </div>
    </section>
  );
}
