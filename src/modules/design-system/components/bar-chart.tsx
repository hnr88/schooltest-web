import { cn } from '@/lib/utils';

import { BAR_CHART_SERIES_CLASSES } from '@/modules/design-system/constants/bar-chart.constants';
import type { BarChartProps } from '@/modules/design-system/types/record.types';

// Canonical BarChart (§07 — DS Dashboard components): flex, align-end, 14px gap,
// 140px tall; bars max-width 38px with an 8px 8px 3px 3px radius; past #DBEAFE,
// recent #93C5FD, current #2563EB + a primary glow; labels 11.5px, current label
// 600 #2563EB.
// Rendered as a real list, not an <img>: every column exposes its label AND its
// value as text, so the chart is readable without seeing it and needs no alt-text
// summary that can drift from the data.
function BarChart({ items, series, bands, ariaLabel, max, className }: BarChartProps) {
  const hasSeries = Boolean(series && series.length > 0);
  const groupedValues = hasSeries
    ? items.flatMap((item) => (item.bars ?? []).map((bar) => bar.value))
    : items.map((item) => item.value);
  const ceiling = max ?? Math.max(1, ...groupedValues);
  const hasBands = Boolean(bands && bands.length > 0);

  const columns = items.map((item) => {
    const bars = hasSeries ? (item.bars ?? []) : [item];
    return (
      <li key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.75">
        {bars.map((bar, index) => (
          <span className="sr-only" key={series?.[index] ?? index}>
            {hasSeries ? `${series?.[index]} ` : null}
            {item.label}: {bar.display}
          </span>
        ))}
        {/* The plot area must be a definite-height box of its own: a percentage
            height inside an `items-end` list resolves against an auto-height
            column and collapses to nothing. Grouped bars are a nested flex row
            INSIDE that box, never a replacement for it. */}
        <span
          aria-hidden="true"
          className={cn(
            'flex min-h-0 w-full flex-1 items-end justify-center',
            hasSeries && 'h-35 flex-none gap-1',
          )}
        >
          {bars.map((bar, index) => (
            <span
              className={cn(
                hasSeries
                  ? 'block w-full max-w-9.5 rounded-t-lg rounded-b-xs'
                  : 'block w-full max-w-9.5 rounded-t-lg rounded-b-xs transition-[height] duration-700 ease-out-expo motion-reduce:transition-none',
                hasSeries
                  ? BAR_CHART_SERIES_CLASSES[index % BAR_CHART_SERIES_CLASSES.length]
                  : item.current
                    ? 'bg-primary shadow-primary-glow'
                    : 'bg-blue-100',
              )}
              key={series?.[index] ?? index}
              style={{
                height: `${
                  hasSeries
                    ? Math.min(100, Math.max(0, (bar.value / Math.max(1, ceiling)) * 100))
                    : Math.max(2, (bar.value / ceiling) * 100)
                }%`,
              }}
            />
          ))}
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
    );
  });

  if (!hasSeries && !hasBands) {
    return (
      <ul
        data-slot="bar-chart"
        aria-label={ariaLabel}
        className={cn('flex h-35 items-stretch gap-3.5', className)}
      >
        {columns}
      </ul>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="flex min-w-80 flex-col gap-4 py-2">
        {hasSeries ? <BarChartLegend series={series} /> : null}
        <div className="flex items-stretch gap-3">
          {hasBands ? (
            <div
              aria-hidden="true"
              className="grid h-35 shrink-0 grid-rows-1 text-right text-meta text-muted-foreground"
            >
              {[...(bands ?? [])].reverse().map((band, index) => (
                <span
                  className="relative col-start-1 row-start-1 -translate-y-1/2 self-start whitespace-nowrap"
                  style={{ top: `${(index / Math.max(1, (bands?.length ?? 0) - 1)) * 100}%` }}
                  key={`${band}-${index}`}
                >
                  {band}
                </span>
              ))}
            </div>
          ) : null}
          <ul
            data-slot="bar-chart"
            aria-label={ariaLabel}
            className={cn(
              'flex min-w-0 flex-1 items-stretch gap-3.5',
              !hasSeries && 'h-35',
              className,
            )}
          >
            {columns}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BarChartLegend({ series }: Pick<BarChartProps, 'series'>) {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-5">
      {series?.map((label, index) => (
        <span
          className="inline-flex items-center gap-2 text-meta font-semibold text-muted-foreground"
          key={`${label}-${index}`}
        >
          <span
            className={cn(
              'h-2.75 w-2.75 rounded-xs',
              BAR_CHART_SERIES_CLASSES[index % BAR_CHART_SERIES_CLASSES.length],
            )}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

export { BarChart };
