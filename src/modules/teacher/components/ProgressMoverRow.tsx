'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { ProgressDeltaPill } from '@/modules/teacher/components/ProgressDeltaPill';
import { progressDelta } from '@/modules/teacher/lib/class-progress';
import type { ProgressMoverRowProps } from '@/modules/teacher/types/class-progress.types';

// One student in "Students to watch": `Fatema R. 49 → 53` with the direction
// pill. The name is C-TR-4's `display_name` (the surface's short form), and both
// scores are the server's A1 overall score — printed, never recomputed.
function ProgressMoverRow({ mover }: ProgressMoverRowProps) {
  const t = useTranslations('Teacher.results.progress');
  const format = useFormatter();
  const delta = progressDelta(mover.delta);

  return (
    <li
      data-slot="progress-mover"
      data-student-id={mover.student_document_id}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <span className="min-w-0 text-body-sm font-medium text-foreground">
        {mover.display_name}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-body-sm text-body tabular-nums">
          {t('moverScores', { from: mover.score_a, to: mover.score_b })}
        </span>
        <ProgressDeltaPill
          direction={delta.direction}
          change={format.number(delta.magnitude, { maximumFractionDigits: 0 })}
        />
      </span>
    </li>
  );
}

export { ProgressMoverRow };
