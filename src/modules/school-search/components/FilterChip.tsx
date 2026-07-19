'use client';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { chipVariants } from '@/modules/school-search/lib/chip-variants';

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

function FilterChip({ active, className, children, ...props }: FilterChipProps) {
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

export { FilterChip };
