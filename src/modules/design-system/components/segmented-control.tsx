'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import type { SegmentedControlProps } from '@/modules/design-system/types/design-system.types';

function SegmentedControl({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedControlProps) {
  return (
    <ToggleGroup
      data-slot="segmented-control"
      aria-label={ariaLabel}
      spacing={1}
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected === undefined) {
          return;
        }
        onValueChange(selected);
      }}
      className={cn('inline-flex rounded-xl bg-muted p-1', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm aria-pressed:bg-background aria-pressed:text-foreground"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { SegmentedControl };
