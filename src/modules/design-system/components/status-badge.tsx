import { cn } from '@/lib/utils';
import { DOT_CLASSES, PILL_CLASSES } from '@/modules/design-system/constants/status-badge.constants';

import type { StatusBadgeProps } from '@/modules/design-system/types/design-system.types';

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        PILL_CLASSES[status],
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_CLASSES[status])} />
      {label}
    </span>
  );
}

export { StatusBadge };
