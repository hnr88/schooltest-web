'use client';

import { useTranslations } from 'next-intl';

import {
  PROGRESS_DIRECTION_ICON,
  PROGRESS_DIRECTION_LABEL_KEY,
} from '@/modules/teacher/constants/class-progress.constants';
import type { SubskillDeltaLineProps } from '@/modules/teacher/types/student-drill-down.types';

// The wireframe's `was 62% ↑16` (.qa/DESIGN.md §Both tests completed), rendered as
// TEXT: the earlier likelihood, then the direction's own WORD and the magnitude.
//
// WCAG 2.2 AA 1.4.1 / 1.1.1: the arrow is `aria-hidden` decoration and no colour
// of its own is applied — the line inherits the tile's ink, so it stays legible on
// the green, amber, red and grey tints alike, and a reader who cannot see the tint
// still gets "was 62%, Up 16" as words.
//
// Both numbers are C-TR-2's: `previous_likelihood` verbatim and the magnitude of
// the server's `delta`. Nothing here subtracts one likelihood from another, and
// nothing compares either to a mastery cut.
function SubskillDeltaLine({ delta }: SubskillDeltaLineProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tDirection = useTranslations('Teacher.results.progress');
  const Icon = PROGRESS_DIRECTION_ICON[delta.direction];

  return (
    <span
      data-slot="subskill-delta"
      data-direction={delta.direction}
      className="flex flex-wrap items-center gap-x-1.5 text-caption font-semibold tabular-nums"
    >
      <span>{t('previousLikelihood', { previous: delta.previous })}</span>
      <span className="flex items-center gap-0.5">
        <Icon aria-hidden="true" className="size-3" />
        {tDirection(PROGRESS_DIRECTION_LABEL_KEY[delta.direction], { change: delta.magnitude })}
      </span>
    </span>
  );
}

export { SubskillDeltaLine };
