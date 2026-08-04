import { cn } from '@/lib/utils';
import { SIZE_CLASSES, TONE_CLASSES } from '@/modules/design-system/constants/score-text.constants';
import { getScoreTone } from '@/modules/design-system/lib/score-tone';

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

export { ScoreText };
