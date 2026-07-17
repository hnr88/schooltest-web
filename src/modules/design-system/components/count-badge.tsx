import { cn } from '@/lib/utils';

import type { CountBadgeProps } from '../types/design-system.types';

function CountBadge({ count, ariaLabel, className }: CountBadgeProps) {
  return (
    <span
      data-slot="count-badge"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground',
        className
      )}
    >
      {count}
    </span>
  );
}

export { CountBadge };
