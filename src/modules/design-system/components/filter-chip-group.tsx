'use client';

import { cn } from '@/lib/utils';

import type { FilterChipGroupProps } from '@/modules/design-system/types/data-display.types';

// Canonical panel-header filter chips: solid-primary active, outlined inactive.
// The visual pill stays at the canonical 28px box; touch pointers get the 44px
// target through `pointer-coarse` rather than by inflating the desktop rhythm.
function FilterChipGroup({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: FilterChipGroupProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'inline-flex items-center rounded-full px-3.5 py-1 text-meta transition duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none pointer-coarse:min-h-11',
              isActive
                ? 'border border-primary bg-primary font-semibold text-primary-foreground'
                : 'border border-input bg-card font-medium text-muted-foreground hover:border-primary/40 hover:bg-blue-50 hover:text-secondary-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { FilterChipGroup };
