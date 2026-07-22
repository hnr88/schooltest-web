import { cn } from '@/lib/utils';

import type {
  StatStripProps,
  StatStripSize,
  StatStripTone,
} from '@/modules/design-system/types/data-display.types';

// Canonical detail-hero stat strip: bare value/label pairs, no card, no icon —
// the contrast against the bordered hero is what makes the composition read.
const VALUE_TONES: Record<StatStripTone, string> = {
  default: 'text-foreground',
  positive: 'text-success-strong',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

const VALUE_SIZES: Record<StatStripSize, string> = {
  md: 'text-stat-md',
  sm: 'text-stat-sm',
};

function StatStrip({ items, size = 'md', ariaLabel, className }: StatStripProps) {
  return (
    <dl
      data-slot="stat-strip"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-x-8 gap-y-4', className)}
    >
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
          <dd
            className={cn(
              'order-1 truncate font-bold',
              VALUE_SIZES[size],
              VALUE_TONES[item.tone ?? 'default'],
            )}
          >
            {item.value}
          </dd>
          <dt className="order-2 truncate text-meta text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export { StatStrip };
