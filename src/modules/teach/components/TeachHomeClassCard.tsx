'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { DiagnosticSummaryPanel } from '@/modules/teach/components/DiagnosticSummaryPanel';
import { MonitorSummaryPanel } from '@/modules/teach/components/MonitorSummaryPanel';
import type { TeachHomeClass } from '@/modules/teach/types/teach-home.types';

interface TeachHomeClassCardProps {
  classSummary: TeachHomeClass;
}

// Teach home class card (task 83, mvp-updates §4.9): one card per class on
// the teacher landing dashboard - class name, the diagnostic and live monitor
// summaries, and the same roster / test day / results links the teacher home
// uses today. Dumb renderer; the query hook feeds it from task 84's screen.
export function TeachHomeClassCard({ classSummary }: TeachHomeClassCardProps) {
  const t = useTranslations('Teach');

  return (
    <article
      data-slot="teach-home-class-card"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <h3 className="text-base font-semibold text-foreground">{classSummary.name}</h3>
      <DiagnosticSummaryPanel diagnostic={classSummary.diagnostic} />
      <MonitorSummaryPanel monitor={classSummary.monitor} />
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/teach/results/${classSummary.documentId}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('home.resultsLink')}
        </Link>
        <Link
          href={`/dashboard/teach/classes/${classSummary.documentId}/test-day`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('home.testDayLink')}
        </Link>
        <Link
          href={`/dashboard/teach/classes/${classSummary.documentId}`}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('home.rosterLink')}
        </Link>
      </div>
    </article>
  );
}
