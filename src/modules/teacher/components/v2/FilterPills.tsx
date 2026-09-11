'use client';

import { cn } from '@/lib/utils';
import {
  FILTER_PILL_ACTIVE,
  FILTER_PILL_IDLE,
  FILTER_PILL_SIZES,
  KIT_FOCUS_RING,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { FilterPillsProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the round filter pills of the Live and Family-reports
 * tabs (`Teacher Portal v2.dc.html:1147–1156`, `:1316–1320`): 13px, active navy
 * fill + white 600, idle white + #3D4A5C 500 on a #E4E9F2 border. `aria-pressed`
 * buttons in a labelled group; an optional count follows the label. The
 * design-system FilterChipGroup draws a blue active state at 28px, so it is
 * not reused here.
 */
function FilterPills({
  options,
  value,
  onValueChange,
  label,
  size = 'md',
  className,
}: FilterPillsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="filter-pills"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            data-value={option.value}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border text-[13px] whitespace-nowrap transition-colors motion-reduce:transition-none',
              KIT_FOCUS_RING,
              FILTER_PILL_SIZES[size],
              active ? FILTER_PILL_ACTIVE : FILTER_PILL_IDLE,
            )}
          >
            {option.label}
            {option.count === undefined ? null : (
              <span className="tabular-nums">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { FilterPills };
