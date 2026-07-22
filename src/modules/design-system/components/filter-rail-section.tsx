'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { FilterRailSectionProps } from '@/modules/design-system/types/media.types';

// One filter GROUP inside the rail. Canonical group label is 11px/700/.08em uppercase
// over a #EEF2F7 inner divider (DS "group label" + §01 Divider); the ink is raised
// from the canonical #94A3B8 (2.56:1) to --muted-foreground (4.76:1) so an 11.5px
// bold label still clears AA.
// Collapsible groups are a real disclosure — heading > button > aria-expanded +
// aria-controls — not a div that hides a sibling, and the trigger carries a 44px
// pointer box while the drawn label stays at the canonical height.
function FilterRailSection({
  title,
  children,
  action,
  collapsible,
  defaultOpen = true,
  className,
}: FilterRailSectionProps) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const label = (
    <span className="text-overline font-bold tracking-rail text-muted-foreground uppercase">
      {title}
    </span>
  );

  return (
    <section
      data-slot="filter-rail-section"
      className={cn('border-b border-divider py-4 last:border-b-0', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1">
          {collapsible ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((previous) => !previous)}
              className="relative flex min-h-11 w-full items-center justify-between gap-2 text-left after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {label}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out-expo motion-reduce:transition-none',
                  open && 'rotate-180',
                )}
              />
            </button>
          ) : (
            label
          )}
        </h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div id={panelId} hidden={collapsible ? !open : undefined} className="pt-3">
        {children}
      </div>
    </section>
  );
}

export { FilterRailSection };
