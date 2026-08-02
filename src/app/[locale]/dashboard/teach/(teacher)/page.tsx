import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeacherHomeScreen } from '@/modules/teach';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Teach.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function TeachPage() {
  return <TeacherHomeScreen />;
}
