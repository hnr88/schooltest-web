'use client';

import { Archive, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { DashboardSearch } from '@/modules/dashboard';

interface ChildrenToolbarProps {
  from: number;
  to: number;
  totalCount: number;
  includeArchived: boolean;
  onIncludeArchivedChange: (value: boolean) => void;
}

// The canonical filter field is a 40px VISUAL box (9/14 padding on 14px text,
// DS Question bank / Students screens) — so the painted rounded rect stays at
// `h-10` and only the pointer targets inside it grow past it:
//   • the control itself takes `min-h-11` (44px). It is transparent and
//     border-0, so a 44px box centred in the 40px field paints nothing new and
//     the placeholder stays optically centred — the field reads 40px and hit-
//     tests 44px.
//   • the inline clear button keeps its canonical 24px square and claims ±11px
//     through an `::after`, the same idiom IconButton and the pager squares use.
//     11, not the arithmetic 10: a control laid out on a fractional y loses ~1px
//     to device-pixel rounding, and a real pointer hit test then measures 43.
// `bg-card` because the field sits on the page WELL, not inside a panel: the
// shared control ships fill-less, which on #EEF2F7 left it as a bare outline
// beside a white sibling button. Canonical form fields carry a fill (Students
// search `background:#FFFFFF;border:1px solid #CBD5E1`); #F7F9FC, the other
// canonical fill, is 1.03:1 on this well.
// `rounded-full` on the field and the chip: the portal chrome is a pill language
// (spec 02 §A.3/§A.5 — every button, pill and badge on these two screens is
// border-radius:999px), so a 10px rectangle beside the pill CTA reads as a
// different design system.
const SEARCH_FIELD =
  'contents [&_[data-slot=input-group]]:h-10 [&_[data-slot=input-group]]:rounded-full [&_[data-slot=input-group]]:bg-card [&_[data-slot=input-group]_input]:min-h-11 [&_[data-slot=input-group]_button]:relative [&_[data-slot=input-group]_button]:after:absolute [&_[data-slot=input-group]_button]:after:-inset-2.75';

// Canonical list toolbar — search, filter triggers, then the result readout,
// sitting ABOVE the panel (never inside it): the existing debounced student
// search reused as a name filter, plus the "Include archived" filter toggle.
export function ChildrenToolbar({
  from,
  to,
  totalCount,
  includeArchived,
  onIncludeArchivedChange,
}: ChildrenToolbarProps) {
  const t = useTranslations('Children');

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className={SEARCH_FIELD}>
        <DashboardSearch />
      </div>
      <button
        type="button"
        aria-pressed={includeArchived}
        onClick={() => onIncludeArchivedChange(!includeArchived)}
        className={cn(
          // pointer-coarse:min-h-11 only ever answered touch. The drawn chip is
          // 37.6px and a real pointer scan measured exactly that on a mouse, so the
          // ::after (measured from the 35.6px PADDING box, inside the 1px border)
          // carries the target to 47.6 on every pointer type. The chip keeps its
          // canonical 40px-family box.
          'relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-body-sm font-medium transition duration-200 ease-out-expo after:absolute after:inset-x-0 after:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none pointer-coarse:min-h-11',
          includeArchived
            ? 'border-primary bg-blue-50 text-secondary-foreground'
            : 'border-portal-input bg-card text-muted-foreground hover:border-foreground hover:text-foreground',
        )}
      >
        {includeArchived ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : (
          <Archive aria-hidden="true" className="size-4 text-slate-400" />
        )}
        {t('includeArchived')}
      </button>
      {/* same well/AA rule as the roster lede: #64748B is 4.23:1 on #EEF2F7 */}
      <p className="ml-auto text-meta text-body tabular-nums">
        {t('showing', { from, to, total: totalCount })}
      </p>
    </div>
  );
}
