'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/**
 * One skill's movement on the teacher progress panel, rendered from the
 * SERVER's own growth rendering — `delta_display` VERBATIM ("steady", a coarse
 * signed step) or the band pair a `band_movement` carries. Nothing here
 * subtracts scores or applies a cut; a skill the sitting did not assess
 * renders as a gap line, never as "no change" and never as a zero.
 */
export function ProgressMovementRow({
  attribute,
  label,
  deltaDisplay,
  bandBefore,
  bandAfter,
}: {
  attribute: string;
  label: string;
  deltaDisplay: string | null;
  bandBefore: string | null;
  bandAfter: string | null;
}) {
  const t = useTranslations('Teach.progress');
  const notAssessed = t('notYetAssessed');

  if (deltaDisplay === null) {
    return (
      <li
        data-slot="progress-movement"
        data-attribute={attribute}
        className="flex items-center gap-2 text-sm text-body"
      >
        <Minus aria-hidden className="size-4" />
        {label}: {notAssessed}
      </li>
    );
  }

  if (deltaDisplay === 'band_movement' && bandBefore !== null && bandAfter !== null) {
    return (
      <li
        data-slot="progress-movement"
        data-attribute={attribute}
        className="flex items-center gap-2 text-sm text-foreground"
      >
        <TrendingUp aria-hidden className="size-4 text-primary" />
        {label}: {capitalise(bandBefore)} → {capitalise(bandAfter)}
      </li>
    );
  }

  const down = deltaDisplay.startsWith('-');
  const Icon = deltaDisplay === 'steady' ? Minus : down ? TrendingDown : TrendingUp;

  return (
    <li
      data-slot="progress-movement"
      data-attribute={attribute}
      className="flex items-center gap-2 text-sm text-foreground"
    >
      <Icon
        aria-hidden
        className={cn(
          'size-4',
          deltaDisplay === 'steady'
            ? 'text-muted-foreground'
            : down
              ? 'text-destructive'
              : 'text-primary',
        )}
      />
      {label}: {deltaDisplay === 'steady' ? t('transitionSteadyShort') : deltaDisplay}
    </li>
  );
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
