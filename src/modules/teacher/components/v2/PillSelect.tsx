'use client';

import { cn } from '@/lib/utils';
import {
  KIT_FOCUS_RING,
  PILL_SELECT_SIZES,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { PillSelectProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the design's NATIVE select (design-surfaces §8.4
 * "Select"): 36/r9 on the Classes toolbar, 38/r9 student skill, 40/r10 class
 * switcher, 42/r12 student sort. A plain `<select>` on purpose: the vendored
 * `NativeSelect` pins its inner select to h-8/rounded-lg with no pass-through,
 * and the design draws the browser's own arrow.
 */
function PillSelect({
  options,
  onValueChange,
  label,
  size = 'sm',
  className,
  ...rest
}: PillSelectProps) {
  return (
    <select
      aria-label={label}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn(
        'max-w-full cursor-pointer border bg-white',
        KIT_FOCUS_RING,
        PILL_SELECT_SIZES[size],
        className,
      )}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export { PillSelect };
