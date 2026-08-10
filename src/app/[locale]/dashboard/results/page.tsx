import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { ResultsScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.results.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// A4: the teacher surface lives in the ONE dashboard shell. The layout's
// ParentGuard is a token-presence gate, not a role gate — the teacher role check
// is TeacherGuard's job, exactly as on /dashboard/reports.
export default function ResultsPage() {
  return (
    <TeacherGuard>
      <ResultsScreen />
    </TeacherGuard>
  );
}
