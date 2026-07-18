import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ProgressBar } from './progress-bar';
import type {
  StatCardDeltaTone,
  StatCardIconTone,
  StatCardProps,
} from '@/modules/design-system/types/design-system.types';

const TILE_TONES: Record<StatCardIconTone, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-500',
  navy: 'bg-navy-900 text-white dark:bg-white/10',
};

const DELTA_TONES: Record<StatCardDeltaTone, string> = {
  positive: 'text-green-700 dark:text-green-400',
  neutral: 'text-muted-foreground',
};

function StatCard({
  icon: Icon,
  iconTone = 'blue',
  label,
  value,
  delta,
  deltaTone = 'neutral',
  progress,
  className,
}: StatCardProps) {
  return (
    <Card data-slot="stat-card" className={className}>
      <CardContent className="flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-8.5 shrink-0 items-center justify-center rounded-lg',
              TILE_TONES[iconTone],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="mt-2.5 text-4xl leading-tight font-bold tracking-tight">{value}</p>
        {delta ? (
          <p className={cn('mt-1 text-sm font-medium', DELTA_TONES[deltaTone])}>{delta}</p>
        ) : null}
        {progress !== undefined ? (
          <ProgressBar value={progress} tone="gradient" ariaLabel={label} className="mt-3" />
        ) : null}
      </CardContent>
    </Card>
  );
}

export { StatCard };
