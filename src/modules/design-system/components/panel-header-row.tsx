import { cn } from '@/lib/utils';

import type { PanelHeaderRowProps } from '@/modules/design-system/types/record.types';

// Canonical PanelHeaderRow (§01 — Parent overview, School overview, Child profile,
// Billing, School analytics): space-between, 8px bottom padding, h3 at 17/600
// #0E2350 with margin 0, trailing link at 13.5/600 #2563EB ("All results →").
// Every panel in the app opens with this row; without it each surface re-invents a
// title, which is half of why the panels stopped looking like one family.
function PanelHeaderRow({
  title,
  as = 'h3',
  titleId,
  description,
  action,
  className,
}: PanelHeaderRowProps) {
  const Heading = as;
  return (
    <div
      data-slot="panel-header-row"
      className={cn('flex items-start justify-between gap-3 pb-2', className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading
          id={titleId}
          className="text-panel-title font-semibold text-balance text-foreground"
        >
          {title}
        </Heading>
        {description ? (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export { PanelHeaderRow };
