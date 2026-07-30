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

// School admin class detail page (task 31, st-mvp-pivot): teacher and student
// assignment through C-CLS-03 full-replacement lists. The SchoolAdminGuard in
// the section layout keeps this school_admin-only.
export default async function SchoolClassDetailPage({ params }: SchoolClassDetailPageProps) {
  const { documentId } = await params;
  return <ClassDetailScreen documentId={documentId} />;
}
