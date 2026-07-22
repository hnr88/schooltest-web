import { cn } from '@/lib/utils';

import type { CompletionCellProps } from '@/modules/design-system/types/record.types';

// Canonical CompletionCell (§02.6 — Students roster, Tests in progress): a 7px track
// at #F1F5F9 filling the cell, +9px, then "17/24" at 12.5/600.
// It is a TABLE CELL, not a progress panel: 100% flips the fill to --success so a
// finished row reads at a glance without another badge column.
function CompletionCell({ value, display, ariaLabel, className }: CompletionCellProps) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div
      data-slot="completion-cell"
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={display}
      className={cn('flex min-w-0 items-center gap-2.25', className)}
    >
      <span className="block h-1.75 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-700 ease-out-expo motion-reduce:transition-none',
            width >= 100 ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="shrink-0 text-meta font-semibold text-body tabular-nums">{display}</span>
    </div>
  );
}

export { CompletionCell };
