'use client';

import { useTranslations } from 'next-intl';

import { ProgressStatCell } from '@/modules/teacher/components/ProgressStatCell';
import { useProgressStats } from '@/modules/teacher/hooks/useProgressStats';
import type { ProgressSummarySectionProps } from '@/modules/teacher/types/class-progress.types';

// .qa/DESIGN.md §Progress tab — populated: the header `Reading Test A → Reading
// Test B`, `N students completed both tests`, the STANDING CAVEAT "Only includes
// students who completed both tests for fair comparison.", then the stat row.
//
// The caveat is not decoration: C-TR-4 counts only both-tests students in every
// aggregate, so the sentence is the literal reading rule for everything below it.
// When the server compared FEWER students than completed both tests (C-TR-4's
// EQUATING PRECONDITION suppresses a non-comparable pair), the gap is printed as
// its own line — the honest signal the contract asks for, never papered over.
function ProgressSummarySection({ cohort, summary, compared }: ProgressSummarySectionProps) {
  const t = useTranslations('Teacher.results.progress');
  const stats = useProgressStats(summary, compared);

  return (
    <section
      data-slot="progress-summary"
      aria-labelledby="progress-summary-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="progress-summary-heading" className="text-panel-title font-bold text-foreground">
          {t('title')}
        </h2>
        <p className="text-meta font-semibold text-body">
          {t('bothTests', { count: cohort.both_tests })}
        </p>
        <p data-slot="progress-caveat" className="text-meta text-balance text-muted-foreground">
          {t('caveat')}
        </p>
        {compared < cohort.both_tests ? (
          <p data-slot="progress-suppressed" className="text-meta text-balance text-warning-ink">
            {t('suppressedNote', { compared, bothTests: cohort.both_tests })}
          </p>
        ) : null}
      </div>

      <dl
        aria-label={t('statsLabel')}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((item) => (
          <ProgressStatCell key={item.key} item={item} />
        ))}
      </dl>
    </section>
  );
}

export { ProgressSummarySection };
