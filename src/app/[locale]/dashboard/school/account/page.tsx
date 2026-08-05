import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolAccountScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.account.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function SchoolAccountPage() {
  return <SchoolAccountScreen />;
}
