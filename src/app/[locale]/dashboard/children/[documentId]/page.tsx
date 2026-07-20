import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ChildProfileScreen } from '@/modules/children';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Children.profileMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface ChildProfilePageProps {
  params: Promise<{ documentId: string }>;
}

export default async function ChildProfilePage({ params }: ChildProfilePageProps) {
  const { documentId } = await params;
  return <ChildProfileScreen documentId={documentId} />;
}
