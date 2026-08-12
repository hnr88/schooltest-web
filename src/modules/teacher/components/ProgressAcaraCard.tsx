'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import {
  PROGRESS_ACARA_LABEL_KEY,
  PROGRESS_ACARA_TONE,
} from '@/modules/teacher/constants/class-progress.constants';
import type { ProgressAcaraCardProps } from '@/modules/teacher/types/class-progress.types';

// One ACARA phase-movement card: the count, the movement's own WORDS in a pill
// (the tint is decoration on top of them), and the server's `from → to`
// breakdown lines. "Same phase" additionally carries C-TR-4's
// `same_improved_within_phase` — the wireframe's "Score improved within phase for
// 8 of these" — which is a real second fact about students who did not move.
function ProgressAcaraCard({ card }: ProgressAcaraCardProps) {
  const t = useTranslations('Teacher.results.progress');

  return (
    <li
      data-slot="progress-acara-card"
      data-movement={card.key}
      className="flex flex-col gap-2 rounded-panel border border-border bg-card px-5 py-5"
    >
      <span className="text-stat font-bold text-foreground tabular-nums">{card.count}</span>
      <StatusPill tone={PROGRESS_ACARA_TONE[card.key]} className="normal-case">
        {t(PROGRESS_ACARA_LABEL_KEY[card.key])}
      </StatusPill>

      {card.detail.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {card.detail.map((step) => (
            <li
              key={`${step.from}-${step.to}`}
              className="text-meta text-body tabular-nums"
              data-slot="progress-acara-step"
            >
              {t('acaraDetail', { count: step.count, from: step.from, to: step.to })}
            </li>
          ))}
        </ul>
      ) : null}

      {card.improvedWithinPhase !== null ? (
        <p className="text-meta text-balance text-muted-foreground">
          {t('acaraSameImproved', { count: card.improvedWithinPhase })}
        </p>
      ) : null}
    </li>
  );
}

export { ProgressAcaraCard };
