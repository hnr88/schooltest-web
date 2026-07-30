import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolSectionScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.sections.classes');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: { title: t('metaTitle'), description: t('metaDescription') },
  };
}

export default async function SchoolClassesPage() {
  const t = await getTranslations('SchoolAdmin.sections.classes');
  return (
    <SchoolSectionScreen
      surface="school-admin-classes"
      title={t('title')}
      description={t('description')}
      emptyTitle={t('emptyTitle')}
      emptyDescription={t('emptyDescription')}
    />
  );
}
