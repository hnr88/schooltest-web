import type { ActivityTone } from '@/modules/design-system/types/record.types';

export const DISC_TONES: Record<ActivityTone, string> = {
  brand: 'bg-blue-50 text-primary',
  success: 'bg-success-soft-2 text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  accent: 'bg-teal-100 text-teal-700',
};

export const DOT_TONES: Record<ActivityTone, string> = {
  brand: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  accent: 'bg-accent',
};
