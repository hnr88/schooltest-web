import { getTranslations } from 'next-intl/server';

import { StartTestSessionPanel } from '@/modules/teacher/components/StartTestSessionPanel';

// /dashboard/test-sessions — the destination behind the teacher rail's "Test
// sessions" entry. The page shell stays a Server Component; only the setup
// panel is a client island, because only it holds form state and live reads.
// The join-code panel (035), past sessions table (036) and live grid (037)
// land beside the panel in their own tasks.
export async function TestSessionsScreen() {
  const t = await getTranslations('Teacher.testSessions');

  return (
    <main
      data-surface="teacher-test-sessions"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('title')}</h1>
        <p className="text-lede text-muted-foreground">{t('description')}</p>
      </div>

      <StartTestSessionPanel />
    </main>
  );
}
