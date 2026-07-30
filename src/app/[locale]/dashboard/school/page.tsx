import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolHomeScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function SchoolPage() {
  return <SchoolHomeScreen />;
}
