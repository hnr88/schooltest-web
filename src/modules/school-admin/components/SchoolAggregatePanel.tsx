'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import { PanelHeaderRow, Skeleton } from '@/modules/design-system';
import { useSchoolAggregate } from '@/modules/school-admin/hooks/useSchoolAggregate';

import type { SchoolAggregatePanelProps } from '@/modules/school-admin/types/components.types';

// School overview (task 78, mvp spec 4.3 level 1): all classes combined into
// one view - sat totals plus the per-area status distribution across the
// school - with the class list as the drill-down entry to level 2. Both
// blocks take the design's shared panel language (School Admin Portal.dc.html
// VIEW 1): white 24-radius cards, 17/600 titles over a muted summary, and
// hairline rows.
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
    <section className="flex flex-col gap-5" aria-label={t('aggregateTitle')}>
      <div className="flex flex-col rounded-card bg-card p-7 px-7.5 shadow-sm">
        <PanelHeaderRow
          as="h2"
          title={t('aggregateTitle')}
          description={t('aggregateDescription')}
          className="pb-0"
        />
        <p className="mt-3 text-body-md font-medium text-foreground">
          {t('aggregateSummary', { sat: aggregate.satTotal, roster: aggregate.rosterTotal })}
        </p>
        {aggregate.areas.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
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
                  <tr key={area.code} className="border-b border-divider last:border-b-0">
                    <th scope="row" className="py-2 pr-4 text-left text-body-sm font-medium text-foreground">
                      {td(`areas.${area.code}`)}
                    </th>
                    <td className="px-2 py-2 text-right text-body-sm text-body tabular-nums">{area.mastered}</td>
                    <td className="px-2 py-2 text-right text-body-sm text-body tabular-nums">{area.emerging}</td>
                    <td className="px-2 py-2 text-right text-body-sm text-body tabular-nums">{area.not_mastered}</td>
                    <td className="px-2 py-2 text-right text-body-sm text-body tabular-nums">{area.not_assessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col rounded-card bg-card px-7 py-1.5 shadow-sm">
        <PanelHeaderRow
          as="h2"
          title={t('classesTitle')}
          className="items-baseline pt-5.5 pb-0"
        />
        <ul data-slot="analytics-class-list" className="pb-2">
          {classes.map((klass) => (
            <li key={klass.documentId} className="border-b border-divider last:border-b-0">
              <button
                type="button"
                onClick={() => onSelectClass(klass.documentId)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors duration-200 ease-out-expo hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
              >
                <span className="text-lede font-semibold text-foreground">{klass.name}</span>
                <span className="text-caption text-body tabular-nums">
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
