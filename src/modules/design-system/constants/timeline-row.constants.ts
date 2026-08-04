import type { TimelineTagTone } from '@/modules/design-system/types/primitives.types';

export const TAG_CLASSES: Record<TimelineTagTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-warning-soft text-warning-ink',
  violet: 'bg-avatar-violet-bg text-avatar-violet-fg',
  pink: 'bg-avatar-pink-bg text-avatar-pink-fg',
  neutral: 'bg-muted text-secondary-foreground',
};
