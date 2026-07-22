import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

import type {
  TrendDeltaProps,
  TrendDeltaTone,
} from '@/modules/design-system/types/design-system.types';

const TONE_CLASSES: Record<TrendDeltaTone, string> = {
  positive: 'text-success-strong',
  neutral: 'text-muted-foreground',
  negative: 'text-destructive',
};

const TONE_ICONS = {
  positive: ArrowUpRight,
  neutral: Minus,
  negative: ArrowDownRight,
} as const;

function TrendDelta({ label, tone = 'neutral', showIcon = true, className }: TrendDeltaProps) {
  const Icon = TONE_ICONS[tone];

  return (
    <span
      data-slot="trend-delta"
      className={cn(
        'inline-flex items-center gap-1.5 text-meta font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {showIcon ? (
        <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.6} />
      ) : null}
      {label}
    </span>
  );
}

export { TrendDelta };
