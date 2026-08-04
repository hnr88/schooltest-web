'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LIST_CLASSES, ROOT_CLASSES, TRIGGER_CLASSES } from '@/modules/design-system/constants/underline-tabs.constants';

import type { UnderlineTabsProps } from '@/modules/design-system/types/primitives.types';

// DS §5.6 "Underline tabs": a hairline rule under the row, 26px gaps, 14px/600
// labels, and a 2px underline that overlaps the rule (-1px) on the active tab.
// Idle #64748B, active #2563EB — no pill, no filled slab.
// The primitive's own ::after IS the underline; recolouring/repositioning it via
// the same variant prefix lets tailwind-merge replace the primitive's values
// instead of fighting them. ::before carries the 46px pointer target so the 32px
// visual tab stays canonical.
//
// ROOT_CLASSES is the other half of that pointer target, and it is load-bearing.
// A consumer that makes this row scroll (Settings adds `overflow-x-auto`) turns the
// root into a 33px-tall scroll container, and `overflow-x:auto` forces overflow-y to
// compute to `auto` as well — so the ::before was CLIPPED and all four tabs really
// hit-tested at 33px however generous the inset looked in CSS. The 7px padding gives
// the pseudo 1px of room to spare INSIDE the clip rectangle and the matching
// negative margin hands the space straight back, so nothing in the surrounding
// column moves a pixel.
function UnderlineTabs({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: UnderlineTabsProps) {
  return (
    <Tabs
      data-slot="underline-tabs"
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string') {
          onValueChange(next);
        }
      }}
      className={cn(ROOT_CLASSES, className)}
    >
      <TabsList variant="line" aria-label={ariaLabel} className={LIST_CLASSES}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className={TRIGGER_CLASSES}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export { UnderlineTabs };
