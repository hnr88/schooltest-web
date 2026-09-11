'use client';

import { useTranslations } from 'next-intl';

import { PanelHeaderRow } from '@/modules/design-system';
import { formatTestWindow, toAcaraPhase } from '@/modules/school-admin/lib/school-analytics';

import type { SchoolProgressSectionProps } from '@/modules/school-admin/types/components.types';

// The same stat recess the Diagnostics panel uses (:136-143).
// `metric-card` is kept as the data-slot: tests locate the card by LABEL and
// read the value off it.
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

// VIEW 1, Progress (:132-145): the periodic reading tests, read off the same
// C-RPT-06 payload as Diagnostics. "Reading progress" is an ACARA phase and
// renders the phase LABEL; "Tests this cycle" is the plan's reading allowance;
// "Next test window" is the scheduled window as a date. Each falls back to the
// design's empty value when the endpoint has nothing to report. The design
// draws two tiles; the payload's reading-progress figure keeps its card and
// wraps onto the same auto-fit rhythm.
export function SchoolProgressSection({ summary }: SchoolProgressSectionProps) {
  const t = useTranslations('SchoolAdmin.home');
  const tPhase = useTranslations('SchoolStudents.form.acaraPhaseOption');
  const readingProgress = toAcaraPhase(summary.reading_progress);
  const nextTestWindow = formatTestWindow(summary.next_test_window);

  return (
    <section
      data-slot="school-progress"
      aria-labelledby="school-progress-title"
      className="rounded-card bg-card p-7 px-7.5 shadow-sm"
    >
      <PanelHeaderRow
        as="h2"
        titleId="school-progress-title"
        title={t('progressTitle')}
        description={t('progressSubtitle')}
        className="pb-0"
      />
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label={t('readingProgress')}
          value={readingProgress === null ? t('noValue') : tPhase(readingProgress)}
        />
        <StatTile label={t('testsThisCycle')} value={String(summary.reading_tests_allowed)} />
        <StatTile label={t('nextTestWindow')} value={nextTestWindow ?? t('noValue')} />
      </div>
    </section>
  );
}
