import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolSectionScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.sections.children');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: { title: t('metaTitle'), description: t('metaDescription') },
  };
}

export default async function SchoolChildrenPage() {
  const t = await getTranslations('SchoolAdmin.sections.children');
  return (
    <SchoolSectionScreen
      surface="school-admin-children"
      title={t('title')}
      description={t('description')}
      emptyTitle={t('emptyTitle')}
      emptyDescription={t('emptyDescription')}
    />
  );
}
