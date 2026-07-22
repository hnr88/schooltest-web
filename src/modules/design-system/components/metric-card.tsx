import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  ACTION_LINK_CLASSES,
  ACTION_TONES,
  LABEL_TONES,
  NAVY_TILE,
  TILE_TONES,
  TONE_CLASSES,
  VALUE_SIZES,
  VALUE_TONES,
} from '@/modules/design-system/constants/metric-card.constants';

import { ProgressBar } from './progress-bar';
import { TrendDelta } from './trend-delta';
import type { MetricCardProps } from '@/modules/design-system/types/design-system.types';

// Tone/size tables live in constants/metric-card.constants.ts — including THE RULE
// that decides which single card in a row is allowed to be navy.
function MetricCard({
  icon: Icon,
  iconTone = 'blue',
  label,
  value,
  size = 'md',
  tone = 'light',
  action,
  delta,
  deltaTone = 'neutral',
  progress,
  progressLabel,
  className,
}: MetricCardProps) {
  const isNavy = tone === 'navy';

  return (
    <Card
      data-slot="metric-card"
      data-tone={tone}
      className={cn(
        'h-full gap-0 rounded-panel ring-0 transition duration-200 ease-out-expo [--card-spacing:--spacing(5)] hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <CardContent className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          {/* two lines reserved so a row of cards keeps one value baseline in every locale */}
          <span
            className={cn(
              'line-clamp-2 min-h-10 text-body-sm font-semibold text-balance',
              LABEL_TONES[tone],
            )}
          >
            {label}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'grid size-8.5 shrink-0 place-items-center rounded-lg',
              isNavy ? NAVY_TILE : TILE_TONES[iconTone],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className={cn('mt-2.5 font-bold tabular-nums', VALUE_SIZES[size], VALUE_TONES[tone])}>
          {value}
        </p>
        {delta && !isNavy ? (
          <TrendDelta
            label={delta}
            tone={deltaTone}
            showIcon={deltaTone !== 'neutral'}
            className="mt-1.5"
          />
        ) : null}
        {action ? (
          <Link href={action.href} className={cn(ACTION_LINK_CLASSES, ACTION_TONES[tone])}>
            {action.label} <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : null}
        {progress !== undefined && !isNavy ? (
          <ProgressBar
            value={progress}
            tone="gradient"
            ariaLabel={progressLabel ?? label}
            className="mt-3"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export { MetricCard };
