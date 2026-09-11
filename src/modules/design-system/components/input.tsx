import type { ComponentProps } from 'react';

import { Input as InputPrimitive } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * journeys-and-bugs BUG-003 — the ONE canonical input size, layered from the
 * wrapper (never in `components/ui`, which is read-only): 48px tall, radius 12,
 * 15px inline padding, 14px text — the shared design size every input, select
 * and textarea renders at, app-wide.
 */
function Input({ className, type, ...props }: ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="ds-input"
      className={cn('h-12 rounded-xl px-[15px] text-sm', className)}
      {...props}
    />
  );
}

export { Input };
