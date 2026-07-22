'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/modules/design-system';
import { chipVariants } from '@/modules/search-shared/lib/chip-variants';
import type { SearchSortMenuProps } from '@/modules/search-shared/types/search-shared.types';

// ONE sort control for both panes — SortChip and AgentSortChip were the same
// component twice. Canonical shape is the App Screens "dropdown chip" (`Grade 4 ▾`):
// a pill that carries its current value and opens a radio menu.
function SearchSortMenu({
  label,
  value,
  options,
  isDefault,
  onValueChange,
}: SearchSortMenuProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('group', chipVariants({ active: !isDefault }))}>
        {label}: {selected?.label ?? value}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out-expo group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SearchSortMenu };
