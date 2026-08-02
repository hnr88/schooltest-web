import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TestDayScreen } from '@/modules/test-day';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('TestDay.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface TestDayPageProps {
  params: Promise<{ documentId: string }>;
}

// Teacher test-day page (task 64, st-mvp-pivot; mvp-updates §4.5). The
// TeacherGuard in the section layout keeps this teacher-only; the sitting
// routes re-assert ownership server-side (foreign sitting ≡ 404).
export default async function TestDayPage({ params }: TestDayPageProps) {
  const { documentId } = await params;
  return <TestDayScreen classDocumentId={documentId} />;
}
