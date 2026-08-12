import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { ClassResultsScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.results.detail.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface ClassResultsPageProps {
  params: Promise<{ classDocumentId: string }>;
}

// A4: the teacher surface lives in the ONE dashboard shell, so the class detail
// sits under /dashboard/results — the path task 031's rail already links. The
// layout's ParentGuard is a token-presence gate; the role check is TeacherGuard's
// job, exactly as on the Results class list.
export default async function ClassResultsPage({ params }: ClassResultsPageProps) {
  const { classDocumentId } = await params;

  return (
    <TeacherGuard>
      <ClassResultsScreen classDocumentId={classDocumentId} />
    </TeacherGuard>
  );
}
