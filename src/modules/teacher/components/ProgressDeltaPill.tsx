'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import {
  PROGRESS_DIRECTION_ICON,
  PROGRESS_DIRECTION_LABEL_KEY,
  PROGRESS_DIRECTION_TONE,
} from '@/modules/teacher/constants/class-progress.constants';
import type { ProgressDeltaPillProps } from '@/modules/teacher/types/class-progress.types';

// The wireframe's `↑9`, done accessibly: the arrow is aria-hidden decoration and
// the pill PRINTS the direction word plus the magnitude ("Up 9", "Down 4", "No
// change"). Tone is never the only carrier of the direction (WCAG 2.2 AA 1.4.1).
//
// `change` is the magnitude of a difference the SERVER computed; this pill applies
// no threshold and knows nothing about the 80 % / 50 % mastery cuts.
function ProgressDeltaPill({ direction, change }: ProgressDeltaPillProps) {
  const t = useTranslations('Teacher.results.progress');
  const Icon = PROGRESS_DIRECTION_ICON[direction];

  return (
    <StatusPill
      tone={PROGRESS_DIRECTION_TONE[direction]}
      className="gap-1 tabular-nums normal-case"
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {t(PROGRESS_DIRECTION_LABEL_KEY[direction], { change })}
    </StatusPill>
  );
}

export { ProgressDeltaPill };
