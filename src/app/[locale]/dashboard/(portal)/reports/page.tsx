import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { ReportListScreen } from '@/modules/report';
import { FamilyReportsListScreen } from '@/modules/report/components/FamilyReportsListScreen';
import { ReportAudienceGate } from '@/modules/report/components/ReportAudienceGate';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Report.listMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// F-WEB-TEACHER-REPORT + C-PAR-REPORT (NIGHT-2 W8): the dashboard layout's
// ParentGuard is a token-presence gate, not a role gate — the ROLE decision is
// this page's. The staff arm keeps the teacher list (TeacherGuard semantics
// byte-identical); the parent arm is the family reports list over the
// parent-authorised GET /api/my/results read (PAR-010).
export default function ReportListPage() {
  return (
    <ReportAudienceGate
      staff={
        <TeacherGuard>
          <ReportListScreen />
        </TeacherGuard>
      }
      parent={<FamilyReportsListScreen />}
    />
  );
}
