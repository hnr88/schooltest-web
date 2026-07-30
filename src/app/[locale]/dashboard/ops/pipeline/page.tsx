import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsPipelineHealth } from '@/modules/ops';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.pipeline.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ops console pipeline health (task 69, st-mvp-pivot, C-OPS-03). The OpsGuard
// in the section layout keeps this ops-only.
export default function OpsPipelinePage() {
  return <OpsPipelineHealth />;
}
