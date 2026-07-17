import { cn } from '@/lib/utils';

import type { StatusBadgeProps } from '@/modules/design-system/types/design-system.types';

const PILL_CLASSES: Record<StatusBadgeProps['status'], string> = {
  live: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  scheduled: 'bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-300',
  draft: 'bg-muted text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const DOT_CLASSES: Record<StatusBadgeProps['status'], string> = {
  live: 'bg-green-600',
  scheduled: 'bg-blue-600',
  draft: 'bg-slate-400',
};

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        PILL_CLASSES[status],
        className
      )}
    >
      <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_CLASSES[status])} />
      {label}
    </span>
  );
}

export { StatusBadge };
