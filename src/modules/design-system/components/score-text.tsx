import { cn } from '@/lib/utils';

import type {
  ScoreTextProps,
  ScoreTextSize,
  ScoreTextTone,
} from '@/modules/design-system/types/primitives.types';

// Canonical score read (Students roster, Result timeline, Child profile): bold,
// tone-coloured, and an em dash in muted grey when there is no score yet.
// Canonical inks are #16A34A / #D97706 / #DC2626, which sit at ~3:1 on white —
// axe-serious for 14px bold (not "large" text) — so each tone uses the ink step
// of the SAME hue, the convention already set by StatusPill and AvatarTint.
const TONE_CLASSES: Record<ScoreTextTone, string> = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger-ink',
  neutral: 'text-muted-foreground',
};

// Canonical sizes: 13px row score, 14px default read, 26px detail-header figure.
// `lg` was pinned to the default-scale text-2xl (24px) only because unregistered
// --text-* tokens used to be dropped by cn() as colour conflicts; every custom token
// is registered in src/lib/utils.ts now, so it takes the canonical --text-stat-md.
const SIZE_CLASSES: Record<ScoreTextSize, string> = {
  sm: 'text-caption',
  md: 'text-sm',
  lg: 'text-stat-md',
};

const STRONG_SCORE = 80;
const WEAK_SCORE = 60;

function getScoreTone(value: number | null): ScoreTextTone {
  if (value === null) return 'neutral';
  if (value >= STRONG_SCORE) return 'success';
  if (value >= WEAK_SCORE) return 'warning';
  return 'danger';
}

function ScoreText({
  value,
  display,
  emptyLabel = '—',
  tone,
  size = 'md',
  className,
}: ScoreTextProps) {
  const resolvedTone = tone ?? getScoreTone(value);
  const text = display ?? (value === null ? emptyLabel : `${value}%`);

  return (
    <span
      data-slot="score-text"
      data-tone={resolvedTone}
      className={cn(
        'font-bold tabular-nums',
        SIZE_CLASSES[size],
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      {text}
    </span>
  );
}

export { ScoreText, getScoreTone };
