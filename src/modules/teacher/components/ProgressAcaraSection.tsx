'use client';

import { useTranslations } from 'next-intl';

import { ProgressBar } from '@/modules/design-system';
import { phaseSpread } from '@/modules/results/lib/class-aggregation';
import type { ProgressAcaraSectionProps } from '@/modules/teacher/types/class-analytics.types';

// The ACARA phase spread (task 34, dashboard §3/D2): one bar per bucket over
// the WHOLE roster, the count printed on every row. The null bucket — students
// with no measured phase, including those with no official result yet — is its
// own labelled row (D17), never folded into a named phase.
//
// NO ACARA band guide-lines anywhere (open-risk R2c): these bars count
// students, they do not place scores on a phase axis, and the band cuts live on
// posteriors this surface never sees.
function ProgressAcaraSection({ rows }: ProgressAcaraSectionProps) {
  const t = useTranslations('Teacher.results.progress');
  const spread = phaseSpread(rows);
  const total = rows.length;

  return (
    <section
      data-slot="progress-acara"
      aria-labelledby="progress-acara-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="progress-acara-heading" className="text-panel-title font-bold text-foreground">
          {t('phaseSpreadTitle')}
        </h2>
        <p className="text-meta text-muted-foreground">{t('phaseSpreadCaption')}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {spread.map((bucket) => (
          <li
            key={bucket.phase ?? 'unmeasured'}
            data-slot="progress-phase-row"
            data-phase={bucket.phase ?? 'unmeasured'}
            className="flex flex-col gap-1"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-body-sm font-medium text-foreground">
                {bucket.phase === null ? t('phaseUnmeasured') : bucket.phase}
              </span>
              <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">
                {t('phaseCount', { count: bucket.count, total })}
              </span>
            </div>
            <ProgressBar
              value={total === 0 ? 0 : (bucket.count / total) * 100}
              ariaLabel={bucket.phase === null ? t('phaseUnmeasured') : bucket.phase}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export { ProgressAcaraSection };
