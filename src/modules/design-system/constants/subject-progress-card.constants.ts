import type { SubjectProgressTone } from '@/modules/design-system/types/primitives.types';

export const FILL_CLASSES: Record<SubjectProgressTone, string> = {
  primary: '[&_[data-slot=progress-indicator]]:bg-primary',
  accent: '[&_[data-slot=progress-indicator]]:bg-accent',
  warning: '[&_[data-slot=progress-indicator]]:bg-warning',
  success: '[&_[data-slot=progress-indicator]]:bg-success',
  danger: '[&_[data-slot=progress-indicator]]:bg-destructive',
};

export const VALUE_CLASSES: Record<SubjectProgressTone, string> = {
  primary: 'text-primary',
  accent: 'text-teal-600',
  warning: 'text-warning-ink',
  success: 'text-success-ink',
  danger: 'text-danger-ink',
};
