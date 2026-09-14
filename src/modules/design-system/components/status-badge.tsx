import { cn } from '@/lib/utils';
import { DOT_CLASSES, PILL_CLASSES } from '@/modules/design-system/constants/status-badge.constants';

import type { StatusBadgeProps } from '@/modules/design-system/types/design-system.types';

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        PILL_CLASSES[status],
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', DOT_CLASSES[status])} />
      <span className="min-w-0 truncate" title={label}>
        {label}
      </span>
    </span>
  );
}

export { StatusBadge };
