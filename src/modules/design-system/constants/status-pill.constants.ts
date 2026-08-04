import type { StatusPillTone } from '@/modules/design-system/types/data-display.types';

// Ink (not the 500-level) foregrounds: the canonical pills sit at ~3:1 on their
// soft tints, which axe flags as serious — same hue, AA-safe darkness.
export const TONE_CLASSES: Record<StatusPillTone, string> = {
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-blue-50 text-secondary-foreground',
  neutral: 'bg-muted text-secondary-foreground',
};
