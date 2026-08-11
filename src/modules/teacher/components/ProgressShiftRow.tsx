'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { TableCell, TableHead, TableRow } from '@/modules/design-system';
import { ProgressDeltaPill } from '@/modules/teacher/components/ProgressDeltaPill';
import { progressDelta } from '@/modules/teacher/lib/class-progress';
import type { ProgressShiftRowProps } from '@/modules/teacher/types/class-progress.types';

// One row of the mastery shift table: the subskill's server NAME as a real
// `<th scope="row">`, the two mastered counts, and the server's own `change`.
//
// `a_mastered`/`b_mastered` are counts of students the SERVER banded `mastered`
// over the both-tests cohort; this row prints them and the `change` verbatim. It
// re-thresholds nothing and re-subtracts nothing — the direction is only the sign
// of the number that arrived.
function ProgressShiftRow({ entry, compared }: ProgressShiftRowProps) {
  const t = useTranslations('Teacher.results.progress');
  const format = useFormatter();
  const delta = progressDelta(entry.change);

  return (
    <TableRow
      data-slot="progress-shift-row"
      data-attribute={entry.attribute}
      className="border-border"
    >
      <TableHead scope="row" className="px-3 text-sm font-medium text-foreground">
        {entry.name}
      </TableHead>
      <TableCell className="px-3 text-body-sm text-body tabular-nums">
        {t('masteredCount', { mastered: entry.a_mastered, compared })}
      </TableCell>
      <TableCell className="px-3 text-body-sm text-body tabular-nums">
        {t('masteredCount', { mastered: entry.b_mastered, compared })}
      </TableCell>
      <TableCell className="px-3">
        <ProgressDeltaPill
          direction={delta.direction}
          change={format.number(delta.magnitude, { maximumFractionDigits: 0 })}
        />
      </TableCell>
    </TableRow>
  );
}

export { ProgressShiftRow };
