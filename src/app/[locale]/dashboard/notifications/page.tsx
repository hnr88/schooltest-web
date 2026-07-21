import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { NotificationsScreen } from '@/modules/notifications';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Notifications.meta');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
