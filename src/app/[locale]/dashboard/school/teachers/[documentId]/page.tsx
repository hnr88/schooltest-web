import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherDetailScreen } from '@/modules/teachers';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teachers.detail.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface SchoolTeacherDetailPageProps {
  params: Promise<{ documentId: string }>;
}

// School admin Teacher detail page (mission task 013): one staff account's
// assigned classes and account details. The SchoolAdminGuard in the section
// layout keeps this school_admin-only; the screen itself renders only what the
// existing school-scoped endpoints serve.
export default async function SchoolTeacherDetailPage({ params }: SchoolTeacherDetailPageProps) {
  const { documentId } = await params;
  return <TeacherDetailScreen documentId={documentId} />;
}
