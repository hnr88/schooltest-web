'use client';

import { useTranslations } from 'next-intl';

import { SubskillMasteryRow } from '@/modules/teacher/components/SubskillMasteryRow';
import type { SubskillMasteryListProps } from '@/modules/teacher/types/class-analytics.types';

// .qa/DESIGN.md §Teaching insights (1), task 34 (dashboard §3): one row per
// assessed subskill, WEAKEST AVERAGE FIRST — the ranking the task names — with
// every exclusion stated on the row ("n of N assessed"). The rows arrive in
// that order from `weakestFirstAverages`; the list re-sorts nothing.
function SubskillMasteryList({ averages, secure, totalStudents }: SubskillMasteryListProps) {
  const t = useTranslations('Teacher.results.insights');

  return (
    <section
      data-slot="subskill-mastery"
      aria-labelledby="subskill-mastery-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="subskill-mastery-heading" className="text-panel-title font-bold text-foreground">
          {t('masteryTitle')}
        </h2>
        <p className="text-meta text-muted-foreground">
          {t('masteryCaption', { count: totalStudents })}
        </p>
      </div>

      <ul className="flex flex-col gap-3.5">
        {averages.map((entry) => (
          <SubskillMasteryRow
            key={entry.skill}
            entry={entry}
            secure={secure.get(entry.skill) ?? null}
            totalStudents={totalStudents}
          />
        ))}
      </ul>
    </section>
  );
}

export { SubskillMasteryList };
