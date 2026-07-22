import { cn } from '@/lib/utils';

import type { SkeletonCardProps } from '@/modules/design-system/types/record.types';

// Canonical SkeletonCard (§03 — DS Dashboard components): Panel r16 p20, a 38px
// circle over 11px bars at 60%/85% then 100%/70%, all running the `st-shimmer`
// sweep. `shimmer-sweep` already degrades to the flat base tint under
// prefers-reduced-motion, so the loading state never animates for users who opt out.
// aria-hidden + a live `status` wrapper is the consumer's job; the card itself is
// purely presentational.
const BAR_WIDTHS = ['w-3/5', 'w-11/12', 'w-full', 'w-8/12', 'w-9/12'];

function SkeletonCard({ rows = 4, className }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton-card"
      className={cn(
        'flex flex-col gap-3.5 rounded-panel border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="shimmer-sweep size-9.5 shrink-0 rounded-full" />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="shimmer-sweep h-2.75 w-3/5 rounded-sm" />
          <span className="shimmer-sweep h-2.75 w-11/12 rounded-sm" />
        </span>
      </div>
      {Array.from({ length: Math.max(0, rows - 2) }, (_, index) => (
        <span
          key={index}
          className={cn('shimmer-sweep h-2.75 rounded-sm', BAR_WIDTHS[index % BAR_WIDTHS.length])}
        />
      ))}
    </div>
  );
}

export { SkeletonCard };
