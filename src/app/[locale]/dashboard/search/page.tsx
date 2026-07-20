import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { UnifiedSearchScreen } from '@/modules/unified-search';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('UnifiedSearch.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// C-UI-SEARCH-UNIFIED: ONE page hosts both searches. The parent auth gate lives in
// the dashboard layout (task 012); this page mounts the unified shell only. The shell
// reads `?mode=` via useSearchParams, so it sits behind a Suspense boundary.
export default function UnifiedSearchPage() {
  return (
    <Suspense>
      <UnifiedSearchScreen />
    </Suspense>
  );
}
