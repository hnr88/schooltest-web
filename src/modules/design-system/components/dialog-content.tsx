'use client';

import type { ComponentProps } from 'react';

import { DialogContent as DialogContentPrimitive } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * journeys-and-bugs BUG-002 — the ONE canonical modal size, layered from the
 * wrapper (the vendored primitive stays untouched): width 540px, radius 24px,
 * generous 24px padding. A dialog the design draws wider or narrower passes
 * its own `className` (e.g. the 640px school form, the 460px confirm).
 */
function DialogContent({ className, ...props }: ComponentProps<typeof DialogContentPrimitive>) {
  return (
    <DialogContentPrimitive
      data-slot="dialog-content"
      className={cn('rounded-3xl p-6 sm:max-w-[540px]', className)}
      {...props}
    />
  );
}

export { DialogContent };
