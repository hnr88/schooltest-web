import { cn } from '@/lib/utils';

import type { BarChartProps } from '@/modules/design-system/types/record.types';

// Canonical BarChart (§07 — DS Dashboard components): flex, align-end, 14px gap,
// 140px tall; bars max-width 38px with an 8px 8px 3px 3px radius; past #DBEAFE,
// recent #93C5FD, current #2563EB + a primary glow; labels 11.5px, current label
// 600 #2563EB.
// Rendered as a real list, not an <img>: every column exposes its label AND its
// value as text, so the chart is readable without seeing it and needs no alt-text
// summary that can drift from the data.
function BarChart({ items, ariaLabel, max, className }: BarChartProps) {
  const ceiling = max ?? Math.max(1, ...items.map((item) => item.value));
  return (
    <ul
      data-slot="bar-chart"
      aria-label={ariaLabel}
      className={cn('flex h-35 items-stretch gap-3.5', className)}
    >
      {items.map((item) => (
        <li key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.75">
          <span className="sr-only">
            {item.label}: {item.display}
          </span>
          {/* The plot area must be a definite-height box of its own: a percentage
              height inside an `items-end` list resolves against an auto-height
              column and collapses to nothing. */}
          <span aria-hidden="true" className="flex min-h-0 w-full flex-1 items-end justify-center">
            <span
              className={cn(
                'block w-full max-w-9.5 rounded-t-lg rounded-b-xs transition-[height] duration-700 ease-out-expo motion-reduce:transition-none',
                item.current ? 'bg-primary shadow-primary-glow' : 'bg-blue-100',
              )}
              style={{ height: `${Math.max(2, (item.value / ceiling) * 100)}%` }}
            />
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'w-full truncate text-center text-overline',
              item.current ? 'font-semibold text-primary' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export { BarChart };
