import type {
  StatStripSize,
  StatStripTone,
} from '@/modules/design-system/types/data-display.types';

export const VALUE_TONES: Record<StatStripTone, string> = {
  default: 'text-foreground',
  positive: 'text-success-strong',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

export const VALUE_SIZES: Record<StatStripSize, string> = {
  md: 'text-stat-md',
  sm: 'text-stat-sm',
};
