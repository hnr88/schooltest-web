import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { FamilyReportScreen } from '@/modules/report/components/FamilyReportScreen';
import { ReportAudienceGate } from '@/modules/report/components/ReportAudienceGate';
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

// C-PAR-REPORT (NIGHT-2 W8): ONE route, TWO faces. The staff arm is the
// untouched teacher report (TeacherReportScreen inside TeacherGuard — the
// audience toggle and C-4 read are byte-identical); the parent arm is the
// family face over the parent-authorised /api/my/results read. The resolved
// caller picks the arm (ReportAudienceGate), so a carer finally sees their own
// child's released family report instead of a silent redirect (JF-039).
export default async function TeacherReportPage({ params }: TeacherReportPageProps) {
  const { resultDocumentId } = await params;
  return (
    <ReportAudienceGate
      staff={
        <TeacherGuard>
          <TeacherReportScreen resultDocumentId={resultDocumentId} />
        </TeacherGuard>
      }
      parent={<FamilyReportScreen resultDocumentId={resultDocumentId} />}
    />
  );
}
