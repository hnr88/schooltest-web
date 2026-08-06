import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ClassStudentDetailScreen } from '@/modules/classes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Classes.studentDetailMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface ClassStudentDetailPageProps {
  params: Promise<{ documentId: string; studentDocumentId: string }>;
}

// Spec §2 student drill-down, reached by clicking a student row on the class
// detail page. The SchoolAdminGuard in the section layout keeps it
// school_admin-only — no extra guard is invented here.
export default async function ClassStudentDetailPage({ params }: ClassStudentDetailPageProps) {
  const { documentId, studentDocumentId } = await params;
  return (
    <ClassStudentDetailScreen
      classDocumentId={documentId}
      studentDocumentId={studentDocumentId}
    />
  );
}
