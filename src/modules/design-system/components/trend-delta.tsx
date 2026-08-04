import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { TONE_CLASSES, TONE_ICONS } from '@/modules/design-system/constants/trend-delta.constants';

import type {
  TrendDeltaProps,
  TrendDeltaTone,
} from '@/modules/design-system/types/design-system.types';

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
