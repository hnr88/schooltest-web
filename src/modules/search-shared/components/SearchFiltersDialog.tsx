'use client';

import { useState } from 'react';

import { SlidersHorizontal, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  CountBadge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/modules/design-system';
import { searchChipVariants } from '@/modules/search-shared/lib/chip-variants';
import type { SearchFiltersDialogProps } from '@/modules/search-shared/types/search-shared.types';

// The design's filters OVERLAY (spec 01 §8.6) — the only filter surface this screen
// has at any width: a 560px r24 panel with a pinned header and a pinned footer
// ("Clear all" ↔ the navy "Show N" apply button) over the vendored dialog scrim.
// Enter/exit motion (fade + zoom) comes from the primitive's Base UI data-open /
// data-closed states, and is disabled under prefers-reduced-motion.
function SearchFiltersDialog({
  triggerLabel,
  title,
  description,
  activeCount,
  countLabel,
  closeLabel,
  clearLabel,
  applyLabel,
  onClear,
  children,
}: SearchFiltersDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(searchChipVariants({ tone: 'solid' }), 'group')}>
        <SlidersHorizontal
          aria-hidden="true"
          className="size-3.25 transition-transform duration-200 ease-out-expo group-hover:scale-110 motion-reduce:transition-none"
        />
        {triggerLabel}
        {activeCount > 0 ? (
          <CountBadge count={activeCount} ariaLabel={countLabel} className="bg-blue-600" />
        ) : null}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-none w-full flex-col gap-0 overflow-hidden rounded-card p-0 duration-200 ease-out-expo overlay-viewport sm:max-w-140 motion-reduce:animate-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-divider px-7 py-5.5">
          <div className="min-w-0">
            <DialogTitle className="text-panel-title font-semibold text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{description}</DialogDescription>
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="grid size-8.5 shrink-0 place-items-center rounded-full bg-muted text-foreground transition duration-200 ease-out-expo hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="scroll-region flex-1 px-7 py-6">{children}</div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-divider px-7 py-4.5">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-1 py-2 text-body-md font-semibold text-body underline underline-offset-4 transition-colors duration-200 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full bg-navy-900 px-6.5 py-3.25 text-body-md font-semibold text-primary-foreground shadow-sm transition duration-200 ease-out-expo hover:bg-navy-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {applyLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SearchFiltersDialog };
