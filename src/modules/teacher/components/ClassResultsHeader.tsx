'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { ClassResultsStat } from '@/modules/teacher/components/ClassResultsStat';
import type { ClassResultsStatItem } from '@/modules/teacher/types/results-shell.types';
import {
  classAverage,
  phaseSpread,
  reliableGrowthAverage,
  resultViewsOf,
  scoredCount,
} from '@/modules/results/lib/class-aggregation';
import type { RosterRow } from '@/modules/results/types/roster.types';

// .qa/DESIGN.md §Results — class detail: the class name is the page's h1, the
// roster size sits under it, and the four summary tiles (dashboard §2) are
// computed from the ONE roster payload by the pure layer — class average,
// reliable growth average (fewer than three reliable movers is "not enough
// data"), the ACARA phase spread and scored/total. Nothing here thresholds,
// re-weights or invents a number; every absence renders as an absence.
//
// The trail "Dashboard / Results / <class>" is the app's ONE breadcrumb in the
// topbar; the class name reaches it through the shell's own useRecordCrumb (see
// ClassResultsScreen), so no second breadcrumb is added here.
//
// Named ...RosterProps (not ClassResultsHeaderProps): the results-shell type of
// that name still carries C-TR-1's `summary` legacy, which is not this task's
// surface (the split screen that used it retired with scoring/10's R-16).
interface ClassRosterHeaderProps {
  className: string;
  rows: readonly RosterRow[];
  /** The header class select the screen builds — same cached C-TD-1 read. */
  switcher: ReactNode;
}

function ClassResultsHeader({ className, rows, switcher }: ClassRosterHeaderProps) {
  const t = useTranslations('Teacher.results.detail');
  const format = useFormatter();
  const views = resultViewsOf(rows);

  const average = classAverage(views);
  const growth = reliableGrowthAverage(views);
  const spread = phaseSpread(rows);
  const scored = scoredCount(rows);
  const namedPhases = spread.filter((bucket) => bucket.phase !== null);
  const unmeasured = spread.find((bucket) => bucket.phase === null)?.count ?? 0;

  const stats: ClassResultsStatItem[] = [
    {
      key: 'class-average',
      label: t('tileAverage'),
      value: average === null ? t('noValue') : format.number(average, { maximumFractionDigits: 1 }),
      note: average === null ? t('tileAverageNone') : undefined,
    },
    {
      key: 'reliable-growth',
      label: t('tileGrowth'),
      value:
        growth.state === 'average'
          ? format.number(growth.value, { maximumFractionDigits: 1, signDisplay: 'exceptZero' })
          : t('tileGrowthInsufficient'),
      note: t('tileGrowthNote', { count: growth.qualifying }),
    },
    {
      key: 'phase-spread',
      label: t('tilePhases'),
      value: t('tilePhasesValue', { count: namedPhases.length }),
      note: unmeasured > 0 ? t('tilePhasesUnmeasured', { count: unmeasured }) : undefined,
    },
    {
      key: 'scored-total',
      label: t('tileScored'),
      value: t('tileScoredValue', { scored: scored.scored, total: scored.total }),
    },
  ];

  return (
    <header data-slot="class-results-header" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-portal-title font-bold break-words text-foreground">{className}</h1>
          {/*
            `--color-body` (#475569), not `--muted-foreground` (#64748B): this line
            sits on the dashboard well (#EEF2F7), where axe measured muted at
            4.23:1 for 12.5px text — under the 4.5:1 floor. Body ink is 6.74:1.
          */}
          <p className="text-meta text-body">{t('students', { count: rows.length })}</p>
        </div>
        {/*
          The design's class switcher (`:531–540`, `order:9` — the select trails
          the row). It carries no visible label in the export, so its accessible
          name is rendered by ClassSwitcher itself.
        */}
        {switcher}
      </div>

      {/*
        A named REGION around the list, not `aria-label` on the <dl> itself: `dl`
        has no corresponding ARIA role, so a name put directly on it is not
        reliably exposed (measured — Chrome reports it as DescriptionList and the
        accessibility tree carried no name). The section is the nameable element;
        the <dl>/<dt>/<dd> stay the semantics of the four label/value pairs.
      */}
      <section aria-labelledby="class-summary-heading">
        <h2 id="class-summary-heading" className="sr-only">
          {t('summaryLabel')}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <ClassResultsStat key={item.key} item={item} />
          ))}
        </dl>
      </section>
    </header>
  );
}

export { ClassResultsHeader };
