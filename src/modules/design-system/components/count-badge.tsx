import { cn } from '@/lib/utils';

import type { CountBadgeProps } from '@/modules/design-system/types/design-system.types';

function CountBadge({ count, ariaLabel, className }: CountBadgeProps) {
  return (
    <span
      data-slot="count-badge"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-5 max-w-full min-w-5 items-center justify-center truncate rounded-full bg-destructive px-1 text-micro font-bold text-destructive-foreground',
        className,
      )}
    >
      <span className="min-w-0 truncate" title={String(count)}>
        {count}
      </span>
    </span>
  );
}

export { CountBadge };
