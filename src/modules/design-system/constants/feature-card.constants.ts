import type { FeatureCardTone } from '@/modules/design-system/types/design-system.types';

export const TILE_TONES: Record<FeatureCardTone, string> = {
  light: 'bg-blue-50 text-blue-600',
  navy: 'bg-white/10 text-teal-300',
};

export const DESCRIPTION_TONES: Record<FeatureCardTone, string> = {
  light: 'text-muted-foreground',
  navy: 'text-blue-100/80',
};
