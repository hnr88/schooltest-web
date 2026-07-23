import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { TeacherReportScreen } from '@/modules/report';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Report.reportMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface TeacherReportPageProps {
  params: Promise<{ resultDocumentId: string }>;
}

export default async function TeacherReportPage({ params }: TeacherReportPageProps) {
  const { resultDocumentId } = await params;
  return (
    <TeacherGuard>
      <TeacherReportScreen resultDocumentId={resultDocumentId} />
    </TeacherGuard>
  );
}
