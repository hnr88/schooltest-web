import type { MiniStatTileTone } from '@/modules/design-system/types/design-system.types';

export const VALUE_TONES: Record<MiniStatTileTone, string> = {
  default: 'text-foreground',
  positive: 'text-success-strong',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};
