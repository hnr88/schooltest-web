'use client';

import { useTranslations } from 'next-intl';

import { SubskillMasteryRow } from '@/modules/teacher/components/SubskillMasteryRow';
import type { SubskillMasteryListProps } from '@/modules/teacher/types/teaching-insights.types';

// .qa/DESIGN.md §Teaching insights (1): "Reading subskill mastery across class",
// caption "Students mastered per subskill (most recent test data, N students
// completed)", then one bar per subskill.
//
// The rows are rendered in the order C-TR-3 sent them (ATTRIBUTE_ORDER.reading)
// and the list is never re-sorted by ratio: re-ranking would invent a "worst
// first" reading the endpoint did not send.
function SubskillMasteryList({ mastery, completedCount }: SubskillMasteryListProps) {
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
          {t('masteryCaption', { count: completedCount })}
        </p>
      </div>

      <ul className="flex flex-col gap-3.5">
        {mastery.map((entry) => (
          <SubskillMasteryRow key={entry.attribute} entry={entry} />
        ))}
      </ul>
    </section>
  );
}

export { SubskillMasteryList };
