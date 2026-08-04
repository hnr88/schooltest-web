import type { StatusBadgeProps } from '@/modules/design-system/types/design-system.types';

export const PILL_CLASSES: Record<StatusBadgeProps['status'], string> = {
  live: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  scheduled: 'bg-blue-50 text-navy-800 dark:bg-blue-950 dark:text-blue-300',
  draft: 'bg-muted text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export const DOT_CLASSES: Record<StatusBadgeProps['status'], string> = {
  live: 'bg-green-600',
  scheduled: 'bg-blue-600',
  draft: 'bg-slate-400',
};
