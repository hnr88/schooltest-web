import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { LiveMonitorScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.testSessions.live.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface LiveMonitorPageProps {
  params: Promise<{ sittingDocumentId: string }>;
}

// A4: the teacher surface lives in the ONE dashboard shell, so the live monitoring
// view hangs off `/dashboard/test-sessions` — the exact path task 035's "Go live"
// button already builds from TEST_SESSIONS_PATH, and the path the shell's
// route-meta already resolves to the "Test sessions" crumb.
//
// The layout's ParentGuard is a token-presence gate; the role check is
// TeacherGuard's job, exactly as on the Test sessions list itself.
export default async function LiveMonitorPage({ params }: LiveMonitorPageProps) {
  const { sittingDocumentId } = await params;

  return (
    <TeacherGuard>
      <LiveMonitorScreen sittingDocumentId={sittingDocumentId} />
    </TeacherGuard>
  );
}
