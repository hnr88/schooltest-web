'use client';

import { useTranslations } from 'next-intl';

import { PanelHeaderRow } from '@/modules/design-system';
import { toAcaraPhase } from '@/modules/school-admin/lib/school-analytics';

import type { SchoolDiagnosticsSectionProps } from '@/modules/school-admin/types/components.types';

// One stat recess (School Admin Portal.dc.html:117-120): #F7F9FC tile, radius
// 18, padding 20px 22px, a 12/600 uppercase overline label and a 30/700 navy
// value. `metric-card` is kept as the data-slot: the runtime contract (locate
// the card by its LABEL, read the VALUE off it) is what tests hold it to.
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div data-slot="metric-card" className="rounded-2xl bg-background p-5 px-5.5">
      <div className="text-xs font-semibold uppercase tracking-overline text-slate-600">
        {label}
      </div>
      <div className="mt-2.5 text-stat-lg font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

// VIEW 1, Diagnostics (:113-130): one white 24-radius panel holding the title,
// the summary and the three stat tiles. "Avg. reading level" is an ACARA
// phase, so it renders the school's own phase LABEL — never the raw enum — and
// falls back to the design's empty value when the school has no results.
export function SchoolDiagnosticsSection({ summary }: SchoolDiagnosticsSectionProps) {
  const t = useTranslations('SchoolAdmin.home');
  const tPhase = useTranslations('SchoolStudents.form.acaraPhaseOption');
  const avgReadingLevel = toAcaraPhase(summary.avg_reading_level);

  return (
    <section
      data-slot="school-diagnostics"
      aria-labelledby="school-diagnostics-title"
      className="rounded-card bg-card p-7 px-7.5 shadow-sm"
    >
      <PanelHeaderRow
        as="h2"
        titleId="school-diagnostics-title"
        title={t('diagnosticsTitle')}
        description={t('diagnosticsSubtitle')}
        className="pb-0"
      />
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label={t('studentsTested')} value={String(summary.students_tested)} />
        <StatTile
          label={t('avgReadingLevel')}
          value={avgReadingLevel === null ? t('noValue') : tPhase(avgReadingLevel)}
        />
        <StatTile
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
