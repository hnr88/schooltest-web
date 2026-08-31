import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsClassDetail } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.classDetail.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface OpsClassDetailPageProps {
  params: Promise<{ documentId: string; classDocumentId: string }>;
}

// Ops class inner page (task 015). The OpsGuard in the ops section layout keeps
// this ops-only; the school documentId is carried for the breadcrumb and the
// class-scoped teacher directory backing the edit/assign dialog.
export default async function OpsClassDetailPage({ params }: OpsClassDetailPageProps) {
  const { documentId: schoolDocumentId, classDocumentId } = await params;
  return (
    <OpsClassDetail classDocumentId={classDocumentId} schoolDocumentId={schoolDocumentId} />
  );
}
