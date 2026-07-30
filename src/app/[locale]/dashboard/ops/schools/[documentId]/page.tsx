import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSchoolDetail } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.detail.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface OpsSchoolDetailPageProps {
  params: Promise<{ documentId: string }>;
}

// Ops console school detail (task 66, st-mvp-pivot). The OpsGuard in the
// section layout keeps this ops-only.
export default async function OpsSchoolDetailPage({ params }: OpsSchoolDetailPageProps) {
  const { documentId } = await params;
  return <OpsSchoolDetail documentId={documentId} />;
}
