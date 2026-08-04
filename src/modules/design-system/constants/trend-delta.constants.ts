import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type { TrendDeltaTone } from '@/modules/design-system/types/design-system.types';

export const TONE_CLASSES: Record<TrendDeltaTone, string> = {
  positive: 'text-success-strong',
  neutral: 'text-muted-foreground',
  negative: 'text-destructive',
};

export const TONE_ICONS = {
  positive: ArrowUpRight,
  neutral: Minus,
  negative: ArrowDownRight,
} as const;
