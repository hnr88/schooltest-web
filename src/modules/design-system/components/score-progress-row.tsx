import { cn } from '@/lib/utils';

import type {
  ScoreProgressRowProps,
  ScoreProgressTone,
} from '@/modules/design-system/types/record.types';

// Canonical ScoreProgressRow (§07): grid 90px | 1fr | 44px, 14px gap — name 13.5/600,
// an 8px track on #EEF2F7, value 13.5/700 right-aligned. The `stacked` variant is the
// canonical "Performance by topic" shape: a space-between header over a full-width
// track.
// This is the row the child profile should use instead of a card per subject.
const FILL_TONES: Record<ScoreProgressTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
};

function ScoreProgressRow({
  label,
  value,
  display,
  tone = 'primary',
  orientation = 'row',
  className,
}: ScoreProgressRowProps) {
  const width = Math.min(100, Math.max(0, value));
  const track = (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-divider">
      <span
        className={cn(
          'block h-full rounded-full transition-[width] duration-700 ease-out-expo motion-reduce:transition-none',
          FILL_TONES[tone],
        )}
        style={{ width: `${width}%` }}
      />
    </span>
  );

  if (orientation === 'stacked') {
    return (
      <div
        data-slot="score-progress-row"
        role="group"
        aria-label={`${label} ${display}`}
        className={cn('flex flex-col gap-1.75', className)}
      >
        <span className="flex items-baseline justify-between gap-3 text-body-sm">
          <span className="min-w-0 truncate font-semibold text-foreground">{label}</span>
          <span className="shrink-0 font-bold text-foreground tabular-nums">{display}</span>
        </span>
        {track}
      </div>
    );
  }

  return (
    <div
      data-slot="score-progress-row"
      role="group"
      aria-label={`${label} ${display}`}
      className={cn('grid grid-cols-score-row items-center gap-3.5', className)}
    >
      <span className="truncate text-body-sm font-semibold text-foreground">{label}</span>
      {track}
      <span className="text-right text-body-sm font-bold text-foreground tabular-nums">
        {display}
      </span>
    </div>
  );
}

export { ScoreProgressRow };
