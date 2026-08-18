import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSchoolsTable } from '@/modules/ops';
import { Skeleton } from '@/modules/design-system';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Ops.schools.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Ops console schools list (task 66, st-mvp-pivot). The OpsGuard in the
// section layout keeps this ops-only. Suspense: the table reads the filter
// state from the URL (useSearchParams) and must bail out of prerender.
export default function OpsSchoolsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </main>
      }
    >
      <OpsSchoolsTable />
    </Suspense>
  );
}
