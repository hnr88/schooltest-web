'use client';

import { useTranslations } from 'next-intl';

import { SubskillMasteryRow } from '@/modules/teacher/components/SubskillMasteryRow';
import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import type { SubskillMasteryListProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights · Reading mastery (`:776–798`): every subskill's class mean in
// `readingMastery()` order — fewest students secure first, then the lowest mean — with
// Critical reading (a gate, no band) after the ranked skills. The list re-sorts nothing.
function SubskillMasteryList({ rows }: SubskillMasteryListProps) {
  const t = useTranslations('TeacherPortal.insights');

  return (
    <SectionCard data-insights-section="mastery" title={t('mastery.title')} description={t('mastery.description')}>
      <ul data-slot="insights-mastery" className="flex flex-col gap-3.5">
        {rows.map((row) => (
          <SubskillMasteryRow key={row.skill} row={row} />
        ))}
      </ul>
    </SectionCard>
  );
}

export { SubskillMasteryList };
