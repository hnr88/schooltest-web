'use client';

import { useTranslations } from 'next-intl';

export function DashboardSkeleton() {
  const t = useTranslations('Dashboard');

  return (
    <main className="flex flex-1 flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
      <p className="sr-only" role="status">
        {t('loading')}
      </p>
      {/* Shaped like the five blocks it becomes: greeting row, the 2-up hero grid,
          the "My children" card, the note + recommendations grid, and the dated
          list beside the promo. */}
      <div aria-hidden="true" className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 max-w-full rounded-lg shimmer-sweep" />
          <div className="h-9 w-80 max-w-full rounded-lg shimmer-sweep" />
          <div className="h-4 w-96 max-w-full rounded-lg shimmer-sweep" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-card shimmer-sweep" />
          <div className="h-64 rounded-card shimmer-sweep" />
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="h-6 w-48 max-w-full rounded-lg shimmer-sweep" />
          <div className="h-72 rounded-card shimmer-sweep" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-56 rounded-card shimmer-sweep" />
          <div className="h-56 rounded-card shimmer-sweep" />
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-overview-split">
          <div className="h-80 rounded-card shimmer-sweep" />
          <div className="h-40 rounded-card shimmer-sweep" />
        </div>
      </div>
    </main>
  );
}
