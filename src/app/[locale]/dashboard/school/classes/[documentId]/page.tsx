import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ClassDetailScreen } from '@/modules/classes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Classes.detailMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface SchoolClassDetailPageProps {
  params: Promise<{ documentId: string }>;
}

// School admin class detail page (class-detail spec §1): the class's summary
// figures and its roster with each student's Test A / Test B result, read from
// C-CLS-05. Teacher assignment lives in the Edit-class modal, not on this page.
// The SchoolAdminGuard in the section layout keeps this school_admin-only.
export default async function SchoolClassDetailPage({ params }: SchoolClassDetailPageProps) {
  const { documentId } = await params;
  return <ClassDetailScreen documentId={documentId} />;
}
