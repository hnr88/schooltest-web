'use client';

import { useTranslations } from 'next-intl';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillTone } from '@/modules/design-system';
import type { ProgressStatus, ProgressTransition } from '@/modules/teach/types/progress.types';

import type { ProgressTransitionRowProps } from '@/modules/teach/types/components.types';

// Ladder order drives the direction icon: moving up the reading areas is
// progress, down is regression, level is steady. The wire statuses are
// rendered verbatim - no re-thresholding on this surface (task 50's rule).
const RANK: Record<ProgressStatus, number> = {
  not_mastered: 0,
  emerging: 1,
  mastered: 2,
};

const STATUS_TONE: Record<ProgressStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
};

const ICON_TONE = {
  up: 'text-success-ink',
  down: 'text-danger-ink',
  steady: 'text-muted-foreground',
} as const;

// One reading-area transition between Test A and Test B (task 76): a plain
// localised statement built from the structured statuses, with the two status
// pills beside it. Raw probabilities never render here (Doc 1 s.13).
export function ProgressTransitionRow({ transition }: ProgressTransitionRowProps) {
  const t = useTranslations('Teach.progress');
  const td = useTranslations('Teach.diagnostic');

  const area = td(`areas.${transition.attribute}`);
  const fromWord = t(`statusWord.${transition.from_status}`);
  const toWord = t(`statusWord.${transition.to_status}`);
  const delta = RANK[transition.to_status] - RANK[transition.from_status];
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const label =
    delta === 0
      ? t('transitionSteady', { area, status: fromWord })
      : t('transition', { area, from: fromWord, to: toWord });

  return (
    <li data-slot="progress-transition" className="flex flex-wrap items-center gap-2">
      <Icon
        aria-hidden="true"
        className={cn(
          'size-4',
          delta > 0 ? ICON_TONE.up : delta < 0 ? ICON_TONE.down : ICON_TONE.steady,
        )}
      />
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <StatusPill tone={STATUS_TONE[transition.from_status]}>
          {td(`status.${transition.from_status}`)}
        </StatusPill>
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          →
        </span>
        <StatusPill tone={STATUS_TONE[transition.to_status]}>
          {td(`status.${transition.to_status}`)}
        </StatusPill>
      </span>
    </li>
  );
}
