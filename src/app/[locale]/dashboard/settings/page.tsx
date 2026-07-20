import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Suspense } from 'react';

import { SettingsScreen } from '@/modules/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The client settings screen owns URL-synced tabs (?tab=auth|search|children),
// so it stays under Suspense per Next's useSearchParams rendering boundary.
export default async function SettingsPage() {
  return (
    <Suspense>
      <SettingsScreen />
    </Suspense>
  );
}
