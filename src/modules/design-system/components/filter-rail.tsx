import { cn } from '@/lib/utils';

import type { FilterRailProps } from '@/modules/design-system/types/media.types';

// Canonical filter rail: a Panel (r16, 1px #E3E8F0, shadow-sm) whose HEADER and
// FOOTER are pinned and whose body is the only thing that scrolls.
// The audit measured the previous rail at 862px inside an 836px scrollport with
// `overflow-y: visible` — a sticky element taller than its own scrollport, so its
// title and first filter group were permanently clipped and unreachable. Two rules
// prevent that recurring and both live here rather than in a consumer:
//   `rail-viewport` caps the height at 100svh minus the 64px topbar and the 24px
//   main padding at each end; `scroll-region` gives the body min-height:0 plus a
//   contained, thin-scrollbar overflow.
// Sticky is gated to lg — on a phone the rail belongs in normal flow.
function FilterRail({ title, action, footer, children, className }: FilterRailProps) {
  return (
    <aside
      data-slot="filter-rail"
      className={cn(
        'flex flex-col overflow-hidden rounded-panel border border-border bg-card shadow-sm lg:sticky lg:top-6 lg:rail-viewport',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-panel-title font-semibold text-foreground">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div data-slot="filter-rail-body" className="scroll-region flex-1 px-5">
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-border bg-background px-5 py-3.5">{footer}</div>
      ) : null}
    </aside>
  );
}

export { FilterRail };
