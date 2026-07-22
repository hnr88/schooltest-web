'use client';

import type { SearchToolbarProps } from '@/modules/search-shared/types/search-shared.types';

// The design's FILTER BAR (spec 01 §8.2): one full-width row above the two-column
// body carrying the "All filters" button, a hairline divider, the applied-filter
// chips (or the "no filters" line) and — pushed to the end — the pane's own controls.
// The live result count is the row's heading: it is the only text that changes when a
// filter lands, so `aria-live` wraps IT and not the toolbar, or every sort change
// would re-announce the whole bar.
function SearchToolbar({ count, filters, chips, actions }: SearchToolbarProps) {
  return (
    <div
      data-slot="search-toolbar"
      className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-3"
    >
      <div aria-live="polite" className="min-w-0">
        <h2 className="text-body-md font-semibold text-foreground">{count}</h2>
      </div>
      <span aria-hidden="true" className="mx-1 hidden h-5.5 w-px bg-portal-input sm:block" />
      {filters}
      <span aria-hidden="true" className="mx-1 hidden h-5.5 w-px bg-portal-input sm:block" />
      {chips}
      {actions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
      ) : null}
    </div>
  );
}

export { SearchToolbar };
