import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { ReportListScreen } from '@/modules/report';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Report.listMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// F-WEB-TEACHER-REPORT: the dashboard layout's ParentGuard is a token-presence
// gate, not a role gate — the teacher role check is TeacherGuard's job.
export default function ReportListPage() {
  return (
    <TeacherGuard>
      <ReportListScreen />
    </TeacherGuard>
  );
}
