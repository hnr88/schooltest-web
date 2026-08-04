'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import { Skeleton } from '@/modules/design-system';
import { useSchoolAggregate } from '@/modules/school-admin/hooks/useSchoolAggregate';

import type { SchoolAggregatePanelProps } from '@/modules/school-admin/types/components.types';

// School overview (task 78, mvp spec 4.3 level 1): all classes combined into
// one view - sat totals plus the per-area status distribution across the
// school - with the class list as the drill-down entry to level 2.
export function SchoolAggregatePanel({ classes, onSelectClass }: SchoolAggregatePanelProps) {
  const t = useTranslations('SchoolAdmin.analytics');
  const td = useTranslations('Teach.diagnostic');
  const aggregate = useSchoolAggregate(classes, true);

  if (aggregate.isPending) {
    return (
      <section className="flex flex-col gap-3" aria-label={t('aggregateTitle')}>
        <Skeleton className="h-7 w-1/4" />
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  if (aggregate.isError) {
    return (
      <p role="alert" className="text-sm text-danger-ink">
        {t('loadError')}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-6" aria-label={t('aggregateTitle')}>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground">{t('aggregateTitle')}</h2>
        <p className="max-w-xl text-sm text-body">{t('aggregateDescription')}</p>
        <p className="text-sm font-medium text-foreground">
          {t('aggregateSummary', { sat: aggregate.satTotal, roster: aggregate.rosterTotal })}
        </p>
        {aggregate.areas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left text-xs font-semibold text-body">
                    {t('columns.area')}
                  </th>
                  {(['mastered', 'emerging', 'not_mastered', 'not_assessed'] as const).map((s) => (
                    <th key={s} className="px-2 py-2 text-right text-xs font-semibold text-body">
                      {td(`status.${s}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregate.areas.map((area) => (
                  <tr key={area.code} className="border-b border-border last:border-b-0">
                    <th scope="row" className="py-2 pr-4 text-left text-sm font-medium text-foreground">
                      {td(`areas.${area.code}`)}
                    </th>
                    <td className="px-2 py-2 text-right text-sm text-body tabular-nums">{area.mastered}</td>
                    <td className="px-2 py-2 text-right text-sm text-body tabular-nums">{area.emerging}</td>
                    <td className="px-2 py-2 text-right text-sm text-body tabular-nums">{area.not_mastered}</td>
                    <td className="px-2 py-2 text-right text-sm text-body tabular-nums">{area.not_assessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t('classesTitle')}</h2>
        <ul data-slot="analytics-class-list" className="flex flex-col gap-2">
          {classes.map((klass) => (
            <li key={klass.documentId}>
              <button
                type="button"
                onClick={() => onSelectClass(klass.documentId)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="text-sm font-semibold text-foreground">{klass.name}</span>
                <span className="text-sm text-body tabular-nums">
                  {t('classStudentsLine', { count: klass.student_count })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
