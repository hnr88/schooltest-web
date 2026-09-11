'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * ops-tabs-audit 2026-09-11 — the design's tab-table CARD (`Ops Portal.dc.html
 * :352-418`): ONE white radius-24 card holding the header row (19px/600 title
 * + 13px #7C8698 summary on the left, the 40px/radius-12 actions on the right),
 * then the filter chips, the bulk bar, the rows and the pager.
 *
 * WHY A WRAPPER: the shared directory kit (`@/modules/directory`) renders the
 * header, toolbar and chips OUTSIDE its rows card, and its header buttons are
 * the primitive's 32px — none of that is reachable through the kit's props,
 * and `src/modules/directory/**` is outside this lane. So the card lives at
 * the call sites: this wrapper supplies the card and the design header, and a
 * set of descendant utilities re-skins the kit's INSIDE to sit on it —
 *
 * - `.scroll-region` (the kit's rows card) loses its own radius/shadow/card
 *   background and its capped internal scroll, so rows flow on THIS card and
 *   the page scrolls instead (the design card has no inner scrollport);
 * - the kit's 24px paddings (bulk bar / rows / loading / empty arms) are
 *   zeroed because the wrapper's own px-6 provides the card inset — otherwise
 *   they double up to 48px.
 *
 * The chips needed no override: `DirectoryChips` draws the design's 34px
 * navy-active pill natively (filters-audit 2026-09-11).
 */
const CARD_CSS = cn(
  'rounded-card bg-card px-6 pb-2 shadow-sm',
  // Flatten the kit's own rows card onto this one.
  '[&_.scroll-region]:max-h-none [&_.scroll-region]:overflow-x-visible [&_.scroll-region]:overflow-y-visible',
  '[&_.scroll-region]:rounded-none [&_.scroll-region]:bg-transparent [&_.scroll-region]:shadow-none',
  '[&_.scroll-region]:focus-visible:ring-0',
  // The wrapper owns the card inset; the kit's inner paddings step aside.
  '[&_[data-slot=directory-bulk-bar]]:px-0',
  '[&_[data-slot=directory-rows]]:px-0',
  '[&_[data-slot=directory-loading]]:px-0',
  '[&_[data-slot=directory-empty]]:px-0',
);

/**
 * The header row (`:353-368`): title + summary left, `actions` right, wrapping
 * on narrow viewports. Callers pass THEIR OWN buttons here — the kit header's
 * 32px primitives are the mismatch, so the kit `header` prop is left unused by
 * every surface mounted on this card.
 */
export function OpsTabTableCard({
  title,
  summary,
  actions,
  children,
  className,
}: {
  title: string;
  summary?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-slot="ops-tab-table-card" className={cn(CARD_CSS, className)}>
      <div className="flex flex-wrap items-start justify-between gap-5 pb-3.5 pt-6">
        <div className="min-w-0">
          <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
          {summary ? <p className="mt-[5px] text-[13px] text-[#7C8698]">{summary}</p> : null}
        </div>
        {actions ? <div className="flex flex-none flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * The design's 96px status pill (`:406`): 12px/600, padding 6px 13px, FIXED
 * 96px width, centred. The design-system StatusPill already carries the
 * 12px/600 title-case look; this adds only the tab-table's fixed width.
 */
export const OPS_TAB_STATUS_PILL_CLASS = 'w-24 justify-center';
