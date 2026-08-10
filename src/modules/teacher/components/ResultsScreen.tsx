import { SquareCheckBig } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { TeacherPagePlaceholder } from '@/modules/teacher/components/TeacherPagePlaceholder';

// /dashboard/results — the destination behind the teacher rail's "Results" entry.
// The class table, teaching insights and the A→B progress tabs ship in tasks
// 040-046.
export async function ResultsScreen() {
  const t = await getTranslations('Teacher.results');

  return (
    <TeacherPagePlaceholder
      surface="teacher-results"
      icon={SquareCheckBig}
      title={t('title')}
      description={t('description')}
      placeholderTitle={t('placeholderTitle')}
      placeholderDescription={t('placeholderDescription')}
    />
  );
}
