import type {
  StatCardDeltaTone,
  StatCardIconTone,
} from '@/modules/design-system/types/design-system.types';

export const TILE_TONES: Record<StatCardIconTone, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-500',
  navy: 'bg-navy-900 text-white dark:bg-white/10',
};

export const DELTA_TONES: Record<StatCardDeltaTone, string> = {
  positive: 'text-green-700 dark:text-green-400',
  neutral: 'text-muted-foreground',
};
