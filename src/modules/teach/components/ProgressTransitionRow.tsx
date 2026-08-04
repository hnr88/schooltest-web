'use client';

import { useTranslations } from 'next-intl';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillTone } from '@/modules/design-system';
import type { ProgressStatus, ProgressTransition } from '@/modules/teach/types/progress.types';

import type { ProgressTransitionRowProps } from '@/modules/teach/types/components.types';
import { ICON_TONE, RANK, PROGRESS_STATUS_TONE } from '@/modules/teach/constants/components.constants';

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
        <StatusPill tone={PROGRESS_STATUS_TONE[transition.from_status]}>
          {td(`status.${transition.from_status}`)}
        </StatusPill>
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          →
        </span>
        <StatusPill tone={PROGRESS_STATUS_TONE[transition.to_status]}>
          {td(`status.${transition.to_status}`)}
        </StatusPill>
      </span>
    </li>
  );
}
