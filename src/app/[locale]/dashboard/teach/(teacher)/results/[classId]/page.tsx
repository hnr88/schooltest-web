import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DiagnosticDashboard, ExportMarkdownButton, ProgressPanel } from '@/modules/teach';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teach.diagnostic.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface TeachDiagnosticPageProps {
  params: Promise<{ classId: string }>;
}

// Teacher results page (tasks 75-77, st-mvp-pivot): the C-RPT-01 class
// mastery profiles plus the nested item-type heat map, with the C-RPT-02
// progress panel (Test B against the Test A benchmark) under it and the
// C-RPT-03 markdown export button in the dashboard header (mvp spec 4.10 -
// the teacher pastes the file into their own AI assistant). All three keep
// their WYSIWYG empty states until the data exists. The TeacherGuard in the
// section layout keeps this teacher-only; the reporting scoping keeps it
// own-classes-only.
export default async function TeachDiagnosticPage({ params }: TeachDiagnosticPageProps) {
  const { classId } = await params;
  return (
    <>
      <DiagnosticDashboard
        classId={classId}
        actions={<ExportMarkdownButton classId={classId} />}
      />
      <ProgressPanel classId={classId} />
    </>
  );
}
