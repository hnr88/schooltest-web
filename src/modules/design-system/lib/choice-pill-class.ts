import { cn } from '@/lib/utils';
import { SIZE } from '@/modules/design-system/constants/choice-pill-group.constants';

import type { ChoicePillSize } from '@/modules/design-system/types/choice.types';

export function pillClass(size: ChoicePillSize, selected: boolean, disabled?: boolean) {
  return cn(
    'relative inline-flex min-w-0 items-center rounded-full border transition-colors duration-200 ease-out-expo after:absolute after:inset-x-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
    SIZE[size],
    selected
      ? 'border-primary bg-blue-50 font-semibold text-primary'
      : 'border-input bg-card font-medium text-body hover:bg-background',
    disabled && 'cursor-not-allowed opacity-55 hover:bg-card',
  );
}
