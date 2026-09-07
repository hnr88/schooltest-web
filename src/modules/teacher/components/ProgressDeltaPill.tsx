'use client';

import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import type { StatusPillTone } from '@/modules/design-system';
import type { ProgressDirection } from '@/modules/teacher/types/student-drill-down.types';

// The wireframe's `↑9`, done accessibly: the arrow is aria-hidden decoration and
// the pill PRINTS the direction word plus the magnitude ("Up 9", "Down 4", "No
// change"). Tone is never the only carrier of the direction (WCAG 2.2 AA 1.4.1).
//
// `change` is the magnitude of a difference the SERVER computed; this pill applies
// no threshold and knows nothing about any mastery cut. The direction maps moved
// here from the retired v1 progress constants (task 34) — this pill
// and the drill-down's comparison strip are their only consumers.
const PROGRESS_DIRECTION_TONE: Record<ProgressDirection, StatusPillTone> = {
  up: 'success',
  flat: 'neutral',
  down: 'danger',
};

const PROGRESS_DIRECTION_ICON: Record<ProgressDirection, LucideIcon> = {
  up: ArrowUp,
  flat: Minus,
  down: ArrowDown,
};

/** The direction's own WORD, under `Teacher.results.progress` — always printed. */
const PROGRESS_DIRECTION_LABEL_KEY: Record<ProgressDirection, string> = {
  up: 'directionUp',
  flat: 'directionFlat',
  down: 'directionDown',
};

/** `change` is the already-formatted MAGNITUDE of a server-sent difference. */
interface ProgressDeltaPillProps {
  direction: ProgressDirection;
  change: string;
}

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
