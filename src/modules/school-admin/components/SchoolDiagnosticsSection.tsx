'use client';

import { BookOpenCheckIcon, GaugeIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard, PanelHeaderRow } from '@/modules/design-system';
import { toAcaraPhase } from '@/modules/school-admin/lib/school-analytics';

import type { SchoolDiagnosticsSectionProps } from '@/modules/school-admin/types/components.types';

// Spec section 1, Diagnostics: the initial placement reading tests aggregated
// across every class, read straight off C-RPT-06. "Avg. reading level" is an
// ACARA phase, so it renders the school's own phase LABEL — never the raw enum
// — and falls back to the spec's empty value when the school has no results.
export function SchoolDiagnosticsSection({ summary }: SchoolDiagnosticsSectionProps) {
  const t = useTranslations('SchoolAdmin.home');
  const tPhase = useTranslations('SchoolStudents.form.acaraPhaseOption');
  const avgReadingLevel = toAcaraPhase(summary.avg_reading_level);

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
          value={String(summary.students_tested)}
        />
        <MetricCard
          icon={GaugeIcon}
          iconTone="teal"
          label={t('avgReadingLevel')}
          value={avgReadingLevel === null ? t('noValue') : tPhase(avgReadingLevel)}
        />
        <MetricCard
          icon={BookOpenCheckIcon}
          iconTone="amber"
          label={t('readingTestsCompleted')}
          value={t('testsCompletedValue', {
            completed: summary.reading_tests_completed,
            total: summary.reading_tests_allowed,
          })}
        />
      </div>
    </section>
  );
}
