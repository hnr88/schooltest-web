import type { TintTileTone } from '@/modules/design-system/types/record.types';

// Ink inside a tint is --color-body (6.9:1 on every tone below); --muted-foreground
// is 4.34:1 on #F1F5F9 and fails AA there.
export const TONES: Record<TintTileTone, string> = {
  inset: 'bg-surface-inset text-body',
  well: 'bg-background text-body',
  brand: 'bg-blue-50 text-secondary-foreground',
  accent: 'bg-teal-50 text-teal-700',
};
