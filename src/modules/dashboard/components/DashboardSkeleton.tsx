'use client';

import { useTranslations } from 'next-intl';

export function DashboardSkeleton() {
  const t = useTranslations('Dashboard');

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <p className="sr-only" role="status">
        {t('loading')}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-64 max-w-full rounded-lg shimmer-sweep" />
          <div className="h-4 w-80 max-w-full rounded-lg shimmer-sweep" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-52 rounded-panel shimmer-sweep" />
          <div className="h-52 rounded-panel shimmer-sweep" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-32 rounded-panel shimmer-sweep" />
          <div className="h-32 rounded-panel shimmer-sweep" />
          <div className="h-32 rounded-panel shimmer-sweep" />
          <div className="h-32 rounded-panel shimmer-sweep" />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="h-80 rounded-panel shimmer-sweep xl:col-span-8" />
          <div className="h-80 rounded-panel shimmer-sweep xl:col-span-4" />
        </div>
      </div>
    </main>
  );
}
