import { Search } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { TopbarSearchTriggerProps } from '@/modules/design-system/types/primitives.types';

// DS §2.4, the topbar's FIRST element (Parent overview header): a 380px-max
// #F1F5F9 pill, 10px radius, 9/14 padding, 15px magnifier at #94A3B8.
// It is a real destination, not decoration — it navigates to the unified search
// route, so nothing here is a dead control.
// One deliberate deviation from the canonical pixels: the placeholder ink is
// slate-600, not #94A3B8. #94A3B8 on #F1F5F9 measures 2.6:1 and axe flags it
// serious; slate-600 keeps the grey placeholder read at an AA-safe 6.8:1.
// The 38px visual pill carries a 46px pointer target via the ::after inset (4px per
// side, not the arithmetic 3px — see icon-button.tsx for why exactly-44 measures 42).
// `text-sm` IS the canonical 14px here — no custom --text-* token sits at that size.
function TopbarSearchTrigger({ href, placeholder, label, className }: TopbarSearchTriggerProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-slot="topbar-search-trigger"
      className={cn(
        'relative flex w-full max-w-95 min-w-0 items-center gap-2.5 rounded-lg bg-muted px-3.5 py-2.25 text-sm text-slate-600 transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-divider hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none dark:text-muted-foreground',
        className,
      )}
    >
      <Search aria-hidden="true" strokeWidth={2} className="size-3.75 shrink-0 text-slate-400" />
      <span className="truncate">{placeholder}</span>
    </Link>
  );
}

export { TopbarSearchTrigger };
