'use client';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { chipVariants } from '@/modules/search-shared/lib/chip-variants';

interface SearchFilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

// Shared toggle chip used by every search pane's filter bar (spec §13.1).
function SearchFilterChip({ active, className, children, ...props }: SearchFilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-active={active}
      className={cn(chipVariants({ active }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { SearchFilterChip };
