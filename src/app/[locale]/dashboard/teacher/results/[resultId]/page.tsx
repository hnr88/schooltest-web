import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherGuard } from '@/modules/auth';
import { StudentResultWired } from '@/modules/results/components/StudentResultWired';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teacher.results.detail.meta');
  return { title: t('title'), description: t('description') };
}

interface StudentResultPageProps {
  params: Promise<{ resultId: string }>;
}

// Task 31's route, the one its spec drives (`/en/dashboard/teacher/results/:id`):
// the sitting report for ONE result, mounted from the task 30/31/32 Screen C
// components. The page is deliberately thin — TeacherGuard for the role, the
// resultId from the async params, and the results module's own wired screen for
// every fetch state. The specs intercept /api/results/:id, so this route is
// provable without the live endpoint.
export default async function StudentResultPage({ params }: StudentResultPageProps) {
  const { resultId } = await params;

  return (
    <TeacherGuard>
      <StudentResultWired resultId={resultId} />
    </TeacherGuard>
  );
}
