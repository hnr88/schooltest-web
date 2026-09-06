'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { OpsSectionTimersForm } from '@/modules/ops/components/OpsSectionTimersForm';
import {
  useSectionTimersQuery,
  type TimersReadSection,
} from '@/modules/ops/queries/use-section-timers.query';

// Ops section-timers screen (task 68, C-TMR-01; OPS-080, C-OPS-PORTAL-070).
// One global timer per section: the active configuration is shown as read
// values first, then the editor. Every save is versioned server-side and never
// retroactive - the note under the inputs says exactly that.
export function OpsSectionTimers() {
  const t = useTranslations('Ops.timers');
  const tv = useTranslations('Ops.timers.validation');
  const format = useFormatter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const timersQuery = useSectionTimersQuery(hydrated && Boolean(token));

  // Whole minutes when the stored value is one, the honest seconds when it is
  // not. Both are localised by Intl, so neither needs its own message key.
  const describe = (section: TimersReadSection): string =>
    section.minutes === null
      ? format.number(section.duration_seconds, {
          style: 'unit',
          unit: 'second',
          unitDisplay: 'long',
        })
      : format.number(section.minutes, { style: 'unit', unit: 'minute', unitDisplay: 'long' });

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

  const sections = timersQuery.data.sections;
  const outOfRange = sections.filter((section) => section.minutes === null);

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
      <dl
        data-surface="ops-timers-active"
        className="flex max-w-xl flex-col gap-2 rounded-xl border border-border bg-card p-4"
      >
        {sections.map((section) => (
          <div
            key={section.stage}
            data-timer-stage={section.stage}
            data-timer-seconds={section.duration_seconds}
            data-timer-minutes={section.minutes ?? ''}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-sm text-body">{t('sectionLabel', { stage: section.stage })}</dt>
            <dd className="text-sm font-semibold text-foreground">{describe(section)}</dd>
          </div>
        ))}
      </dl>
      {outOfRange.length > 0 ? (
        <div data-surface="ops-timers-range-warning" className="max-w-xl">
          <Alert variant="warning" title={tv('range')}>
            {outOfRange
              .map((section) => `${t('sectionLabel', { stage: section.stage })}: ${describe(section)}`)
              .join(', ')}
          </Alert>
        </div>
      ) : null}
      <OpsSectionTimersForm sections={sections} meta={timersQuery.data.meta} />
    </main>
  );
}
