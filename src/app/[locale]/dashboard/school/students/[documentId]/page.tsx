import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolStudentDetailScreen } from '@/modules/school-students';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolStudents.detailMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface SchoolStudentDetailPageProps {
  params: Promise<{ documentId: string }>;
}

// School admin student detail page: the C-CHD-06 record behind every roster row
// (spec §4 "each row is clickable and navigates to an individual student detail
// view"). The SchoolAdminGuard in the section layout keeps this
// school_admin-only, and the server scopes the read to the caller's own school.
export default async function SchoolStudentDetailPage({ params }: SchoolStudentDetailPageProps) {
  const { documentId } = await params;
  return <SchoolStudentDetailScreen documentId={documentId} />;
}
