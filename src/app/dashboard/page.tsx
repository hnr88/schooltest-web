import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardScreen } from '@/modules/dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The parent auth gate lives in the dashboard layout (task 012) — this page
// renders the Overview content only; the layout guards every /dashboard/* once.
export default function DashboardPage() {
  return <DashboardScreen />;
}
