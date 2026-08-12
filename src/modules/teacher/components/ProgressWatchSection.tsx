'use client';

import { useTranslations } from 'next-intl';

import { ProgressWatchList } from '@/modules/teacher/components/ProgressWatchList';
import type { ProgressWatchSectionProps } from '@/modules/teacher/types/class-progress.types';

// .qa/DESIGN.md §Progress tab: "Students to watch" — `Most improved`
// (`Carlos M. 45 → 63 (+18)`) beside `Needs attention` (`Omar K. 52 → 48 (−4)`)
// with the note "These students regressed — may need individual follow-up."
//
// Both lists are C-TR-4's own: `most_improved` is the server's top 3 with a
// positive delta, `needs_attention` every negative delta worst-first. The portal
// does not re-rank, re-slice or pad them, and a student only ever appears with a
// numeric score on BOTH tests.
function ProgressWatchSection({ mostImproved, needsAttention }: ProgressWatchSectionProps) {
  const t = useTranslations('Teacher.results.progress');

  return (
    <section
      data-slot="progress-watch"
      aria-labelledby="progress-watch-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <h2 id="progress-watch-heading" className="text-panel-title font-bold text-foreground">
        {t('watchTitle')}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProgressWatchList variant="most_improved" movers={mostImproved} />
        <ProgressWatchList variant="needs_attention" movers={needsAttention} />
      </div>
    </section>
  );
}

export { ProgressWatchSection };
