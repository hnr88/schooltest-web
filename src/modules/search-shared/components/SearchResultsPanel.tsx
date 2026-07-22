'use client';

import { cn } from '@/lib/utils';
import type { SearchResultsPanelProps } from '@/modules/search-shared/types/search-shared.types';

// The results COLUMN of the search workspace, shared by both panes. The design puts
// nothing above the list (spec 01 §8.4) — the count and every control live in the
// filter bar one row up — so this column is the `scroll-region` list plus a pinned
// pager, and the page itself never grows a scrollbar.
// tabIndex/role/aria-label on the scroller are the a11y contract for `scroll-region`
// (globals.css): without them a keyboard user cannot reach the overflow
// (axe scrollable-region-focusable, serious).
function SearchResultsPanel({
  slot,
  regionLabel,
  footer,
  children,
  className,
}: SearchResultsPanelProps) {
  return (
    <div data-slot={slot} className={cn('flex min-h-0 min-w-0 flex-col lg:h-full', className)}>
      <div
        data-slot="search-results-scroller"
        role="group"
        tabIndex={0}
        aria-label={regionLabel}
        className="min-w-0 rounded-result focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:scroll-region lg:flex-1 lg:px-0.5 lg:pb-2"
      >
        {children}
      </div>
      {footer ? <div className="shrink-0 border-t border-divider">{footer}</div> : null}
    </div>
  );
}

export { SearchResultsPanel };
