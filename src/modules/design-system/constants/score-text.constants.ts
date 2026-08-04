import type {
  ScoreTextSize,
  ScoreTextTone,
} from '@/modules/design-system/types/primitives.types';

// Canonical inks are #16A34A / #D97706 / #DC2626, which sit at ~3:1 on white —
// axe-serious for 14px bold (not "large" text) — so each tone uses the ink step
// of the SAME hue, the convention already set by StatusPill and AvatarTint.
export const TONE_CLASSES: Record<ScoreTextTone, string> = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger-ink',
  neutral: 'text-muted-foreground',
};

// Canonical sizes: 13px row score, 14px default read, 26px detail-header figure.
export const SIZE_CLASSES: Record<ScoreTextSize, string> = {
  sm: 'text-caption',
  md: 'text-sm',
  lg: 'text-stat-md',
};

export const STRONG_SCORE = 80;
export const WEAK_SCORE = 60;
