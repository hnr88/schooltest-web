import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { SittingMonitorRedirect } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.testSessions.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface LiveMonitorPageProps {
  params: Promise<{ sittingDocumentId: string }>;
}

// RETIRED (Teacher Portal v2, R1 PART B). This route rendered the C-TS-3 live
// monitoring grid; the class Live sessions tab (`teacher/components/live/*`)
// replaced it. The route stays as a hand-over because the Classes live strip
// still falls back to it when a live session's class name matches no class of
// the teacher's own list, and because the dashboard's old "Go live" links and
// bookmarks address it. Resolving the class needs the teacher's token, so the
// hop is a client one.
//
// The layout's ParentGuard is a token-presence gate; the role check is
// TeacherGuard's job, exactly as on the Test sessions list itself.
export default async function LiveMonitorPage({ params }: LiveMonitorPageProps) {
  const { sittingDocumentId } = await params;

  return (
    <TeacherGuard>
      <SittingMonitorRedirect sittingDocumentId={sittingDocumentId} />
    </TeacherGuard>
  );
}
