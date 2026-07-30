import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSchoolsTable } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.schools.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ops console schools list (task 66, st-mvp-pivot). The OpsGuard in the
// section layout keeps this ops-only.
export default function OpsSchoolsPage() {
  return <OpsSchoolsTable />;
}
