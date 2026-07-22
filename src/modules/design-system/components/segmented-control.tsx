'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import type {
  SegmentedControlProps,
  SegmentedControlSize,
} from '@/modules/design-system/types/design-system.types';

// Canonical VIEW SWITCHER (DS §10 "Tabs & segmented control"):
//   track inline-flex, gap 4px, #F1F5F9, padding 4px, radius 11px
//   item  13/600, padding 7px 16px, radius 8px
//   active #FFFFFF on #0E2350 + shadow; idle transparent / #64748B
// Compact app variant (`size="sm"`): track radius 10px, item 12.5px / 6px 13px.
// aria-pressed toggle buttons are RIGHT here — this switches what a panel shows, it
// is not a form answer. For a required single-choice FIELD use `SegmentedChoice`,
// which is a real radiogroup.
// Idle ink is --color-body (#475569, 6.92:1 on the #F1F5F9 track); the canonical
// #64748B is 4.34:1 there and fails AA.
const TRACK: Record<SegmentedControlSize, string> = {
  md: 'rounded-segment p-1',
  sm: 'rounded-lg p-1',
};

const ITEM: Record<SegmentedControlSize, string> = {
  md: 'min-h-8.5 rounded-md px-4 py-1.75 text-caption after:-inset-y-1.5',
  sm: 'min-h-8 rounded-sm px-3.25 py-1.5 text-meta after:-inset-y-1.5',
};

function SegmentedControl({
  options,
  value,
  onValueChange,
  ariaLabel,
  size = 'md',
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
      className={cn('inline-flex bg-muted', TRACK[size], className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            'relative font-semibold text-body transition-colors duration-200 ease-out-expo after:absolute after:inset-x-0 hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-sm motion-reduce:transition-none',
            ITEM[size],
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { SegmentedControl };
