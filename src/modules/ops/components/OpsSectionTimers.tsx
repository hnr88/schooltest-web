'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { OpsSectionTimersForm } from '@/modules/ops/components/OpsSectionTimersForm';
import { useSectionTimersQuery } from '@/modules/ops/queries/use-section-timers.query';

// Ops section-timers screen (task 68, C-TMR-01, mvp-updates 4.2): one global
// timer per section. Every save is versioned server-side and never retroactive
// - the note under the inputs says exactly that.
export function OpsSectionTimers() {
  const t = useTranslations('Ops.timers');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const timersQuery = useSectionTimersQuery(hydrated && Boolean(token));

  if (timersQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (timersQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={timersQuery.isFetching}
              onClick={() => timersQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('loadErrorDescription')}
        </Alert>
      </main>
    );
  }

  return (
    <main
      data-slot="ops-section-timers"
      data-surface="ops-section-timers"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <OpsSectionTimersForm sections={timersQuery.data.sections} meta={timersQuery.data.meta} />
    </main>
  );
}
