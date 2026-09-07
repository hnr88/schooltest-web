'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { ProgressDeltaPill } from '@/modules/teacher/components/ProgressDeltaPill';
import type { ProgressDirection } from '@/modules/teacher/types/student-drill-down.types';
import type { ProgressMoverRowProps } from '@/modules/teacher/types/class-analytics.types';

// The SIGN and magnitude of the server's own `delta`, inline because the
// drill-down lib (the helper's old home) is another surface's active rewrite.
// Compares to zero, applies no cut, computes no difference.
function deltaOf(value: number): { direction: ProgressDirection; magnitude: number } {
  return { direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat', magnitude: Math.abs(value) };
}

// One student in a ranked Progress list (task 34, dashboard §3): the name, the
// score, and the direction pill — whose WORD and magnitude come from the
// server's numeric `delta` (reliable rows only; both lists filter upstream).
// This is not a recomputed delta: the pill prints the server number's sign and
// magnitude, and `delta_display` remains the roster row's verbatim field.
function ProgressMoverRow({ row }: ProgressMoverRowProps) {
  const t = useTranslations('Teacher.results.progress');
  const format = useFormatter();
  const view = row.result;
  const delta = view === null || view.overall.delta === null ? null : deltaOf(view.overall.delta);
  const score = view?.overall.domain_score;

  return (
    <li
      data-slot="progress-mover"
      data-student-id={row.student.document_id}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <span className="min-w-0 text-body-sm font-medium text-foreground">
        {row.student.name}
      </span>
      <span className="flex items-center gap-2">
        {typeof score === 'number' ? (
          <span className="text-body-sm text-body tabular-nums">
            {t('moverScore', { score: format.number(score) })}
          </span>
        ) : null}
        {delta ? (
          <ProgressDeltaPill
            direction={delta.direction}
            change={format.number(delta.magnitude, { maximumFractionDigits: 0 })}
          />
        ) : null}
      </span>
    </li>
  );
}

export { ProgressMoverRow };
