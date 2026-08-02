import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { CycleBanner, RosterScreen } from '@/modules/teach';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teach.roster.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface TeachRosterPageProps {
  params: Promise<{ documentId: string }>;
}

// Teacher class roster page (task 63, st-mvp-pivot): read-only C-CHD-01 roster
// with email-status flags ahead of test day. The TeacherGuard in the section
// layout keeps this teacher-only; C-CHD-01 scoping keeps it own-classes-only.
export default async function TeachRosterPage({ params }: TeachRosterPageProps) {
  const { documentId } = await params;
  return (
    <>
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <CycleBanner documentId={documentId} />
      </div>
      <RosterScreen documentId={documentId} />
    </>
  );
}
