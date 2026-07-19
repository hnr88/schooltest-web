import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ParentGuard } from '@/modules/auth';
import { DashboardScreen } from '@/modules/dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Client-guarded shell (D11, task 15): ParentGuard redirects to /sign-in
// without a JWT; authenticated parents see the DashboardScreen stub.
export default function DashboardPage() {
  return (
    <ParentGuard>
      <DashboardScreen />
    </ParentGuard>
  );
}
