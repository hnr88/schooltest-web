import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSectionTimers } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.timers.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ops console section timers (task 68, st-mvp-pivot). The OpsGuard in the
// section layout keeps this ops-only.
export default function OpsTimersPage() {
  return <OpsSectionTimers />;
}
