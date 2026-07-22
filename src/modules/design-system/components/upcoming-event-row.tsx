import { cn } from '@/lib/utils';

import type { UpcomingEventRowProps } from '@/modules/design-system/types/record.types';

// Canonical UpcomingEventRow (§02.10): 1px #EEF2F7, radius 12px, padding 11px 13px,
// 12px gap; a 40px #EFF5FF date block (10px/700 uppercase month over 16px/700 day),
// title 13.5/600, meta 12px, trailing StatusPill.
// The date block is the point — a dated item gets a date OBJECT, not a sentence
// beginning with a month name, which is what makes a schedule scannable.
function UpcomingEventRow({
  month,
  day,
  title,
  meta,
  trailing,
  className,
}: UpcomingEventRowProps) {
  return (
    <div
      data-slot="upcoming-event-row"
      className={cn(
        'flex items-center gap-3 rounded-tile border border-divider px-3.25 py-2.75',
        className,
      )}
    >
      <span className="flex w-10 shrink-0 flex-col items-center rounded-md bg-blue-50 py-1.25">
        <span className="text-micro font-bold tracking-overline text-primary uppercase">
          {month}
        </span>
        <span className="text-sm leading-none font-bold text-foreground tabular-nums">{day}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-sm font-semibold text-foreground">{title}</span>
        {meta ? <span className="truncate text-meta text-muted-foreground">{meta}</span> : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}

export { UpcomingEventRow };
