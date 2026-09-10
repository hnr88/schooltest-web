import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OpsSchoolsTable } from '@/modules/ops';
// OPS-019: imported by path, not through the ops barrel — the barrel is a
// merge-only integration file and its `OpsPortalExports` line is applied by the
// batch integrator. Switch to `@/modules/ops` once that line lands.
import { OpsPortalExports } from '@/modules/ops/components/OpsPortalExports';
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
      {/* ops/43 (R-22): OpsResponsesExport retired — no per-session export
          panel is drawn on `:69-200`. OpsPortalExports stays: task 09
          (still `todo`) owns re-parenting it into the bulk Export. */}
      <div className="flex flex-col gap-3 px-4 pb-6 sm:px-6 lg:px-8">
        <OpsPortalExports />
      </div>
    </Suspense>
  );
}
