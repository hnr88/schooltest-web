import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { StudentDrillDownScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.results.drillDown.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface StudentDrillDownPageProps {
  params: Promise<{ classDocumentId: string; studentDocumentId: string }>;
}

// The student drill-down mirrors C-TR-2's own path shape
// (`classes/:documentId/students/:studentDocumentId`) inside the ONE dashboard
// shell (ASSUMPTION A4), which is exactly what `studentResultsHref` builds for the
// Students-tab row links. Both segments are the server's `document_id`s.
export default async function StudentDrillDownPage({ params }: StudentDrillDownPageProps) {
  const { classDocumentId, studentDocumentId } = await params;

  return (
    <TeacherGuard>
      <StudentDrillDownScreen
        classDocumentId={classDocumentId}
        studentDocumentId={studentDocumentId}
      />
    </TeacherGuard>
  );
}
